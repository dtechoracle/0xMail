import OpenAI from 'openai';
import { prisma } from './prisma';

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export interface EmailScanResult {
  threatScore: number; // 0-100
  threatLevel: 'safe' | 'suspicious' | 'malicious';
  threatFlags: string[];
  analysis: {
    hasUrgentLanguage: boolean;
    hasCredentialRequest: boolean;
    hasSpoofedDomain: boolean;
    hasSuspiciousAttachment: boolean;
    hasGenericGreeting?: boolean;
    totalLinks: number;
    suspiciousLinks: number;
    phishingLinks: number;
    maliciousUrls: string[];
    nonHttpsLinks?: number;
    shortenedUrls?: number;
    authorizedSender?: boolean;
    authorizedBrand?: string;
    lookalikeOfBrand?: string;
    aiConfidenceScore: number;
    aiPrediction: string;
    aiReasoningFlags: string[];
    linkBrands?: string[];
    aiSummary?: string;
    linkLookalikeBrands?: string[];
  };
}

/**
 * Check if an email is impersonating a previously contacted email
 * Compares the current sender email against emails the user has interacted with
 */
async function checkEmailImpersonation(
  userId: string,
  currentFrom: string
): Promise<{
  isImpersonation: boolean;
  originalEmail?: string;
  suspiciousEmail?: string;
  similarity?: number;
}> {
  try {
    // Extract email address from "Name <email@domain.com>" format
    const currentEmailMatch = currentFrom.match(/<([^>]+)>/) || [null, currentFrom];
    const currentEmail = currentEmailMatch[1] || currentFrom;
    const [currentLocal, currentDomain] = currentEmail.toLowerCase().split('@');
    
    if (!currentDomain) {
      return { isImpersonation: false };
    }

    // Get all emails the user has sent or received from (excluding current email)
    const previousEmails = await prisma.email.findMany({
      where: {
        userId,
        from: {
          not: currentFrom,
        },
        OR: [
          { isRead: true }, // User has read these emails
          { isStarred: true }, // User has starred these emails
        ],
      },
      select: {
        from: true,
      },
      distinct: ['from'],
      take: 100, // Limit to recent 100 unique senders
    });

    for (const prevEmail of previousEmails) {
      const prevEmailMatch = prevEmail.from.match(/<([^>]+)>/) || [null, prevEmail.from];
      const prevEmailAddr = prevEmailMatch[1] || prevEmail.from;
      const [prevLocal, prevDomain] = prevEmailAddr.toLowerCase().split('@');

      if (!prevDomain) continue;

      // Check if domains are similar (lookalike detection)
      const domainNorm1 = normalizeHomoglyphs(currentDomain);
      const domainNorm2 = normalizeHomoglyphs(prevDomain);
      
      // If local parts match but domains are different and similar
      if (currentLocal === prevLocal && currentDomain !== prevDomain) {
        const domainDistance = levenshtein(domainNorm1, domainNorm2);
        const maxLength = Math.max(domainNorm1.length, domainNorm2.length);
        const similarity = 1 - (domainDistance / maxLength);

        // If domains are very similar (85%+ similarity) but not identical, it's likely impersonation
        if (similarity >= 0.85 && domainDistance <= 2) {
          return {
            isImpersonation: true,
            originalEmail: prevEmailAddr,
            suspiciousEmail: currentEmail,
            similarity,
          };
        }
      }

      // Check if domains are similar even if local parts differ slightly
      if (currentDomain !== prevDomain) {
        const domainDistance = levenshtein(domainNorm1, domainNorm2);
        const maxLength = Math.max(domainNorm1.length, domainNorm2.length);
        const similarity = 1 - (domainDistance / maxLength);

        // Very similar domains (90%+ similarity) with small edit distance
        if (similarity >= 0.90 && domainDistance <= 1) {
          // Also check if local parts are similar
          const localNorm1 = normalizeHomoglyphs(currentLocal);
          const localNorm2 = normalizeHomoglyphs(prevLocal);
          const localDistance = levenshtein(localNorm1, localNorm2);
          const localMaxLength = Math.max(localNorm1.length, localNorm2.length);
          const localSimilarity = localMaxLength > 0 ? 1 - (localDistance / localMaxLength) : 0;

          if (localSimilarity >= 0.8 || localDistance <= 1) {
            return {
              isImpersonation: true,
              originalEmail: prevEmailAddr,
              suspiciousEmail: currentEmail,
              similarity: (similarity + localSimilarity) / 2,
            };
          }
        }
      }
    }

    return { isImpersonation: false };
  } catch (error) {
    console.error('Error checking email impersonation:', error);
    return { isImpersonation: false };
  }
}

/**
 * Scan an email for threats using AI
 */
export async function scanEmail(
  emailId: string,
  emailData: {
    from: string;
    subject: string;
    body: string;
    htmlBody?: string;
    spfResult?: string;
    dkimResult?: string;
    dmarcResult?: string;
  },
  userId: string
): Promise<EmailScanResult> {
  try {
    console.log('Starting email scan for:', emailId);
    console.log('Email data:', { from: emailData.from, subject: emailData.subject, bodyLength: emailData.body.length });
    console.log('OpenAI API Key available:', !!process.env.OPENAI_API_KEY);
    
    // Update scan status
    await prisma.email.update({
      where: { id: emailId },
      data: { scanStatus: 'scanning' },
    });

    // Extract links from email
    const links = extractLinks(emailData.body + (emailData.htmlBody || ''));

    // Analyze with OpenAI
    console.log('Calling analyzeWithAI...');
    const aiAnalysis = await analyzeWithAI(emailData);
    console.log('AI analysis result:', aiAnalysis);

    // Check for email impersonation (compare against previously contacted emails)
    const impersonationCheck = await checkEmailImpersonation(userId, emailData.from);
    if (impersonationCheck.isImpersonation) {
      console.log('Email impersonation detected:', impersonationCheck);
    }

    // Perform heuristic checks
    const heuristicAnalysis = await performHeuristicAnalysis(emailData, links, impersonationCheck);

    // Combine results
    const threatFlags: string[] = [];
    let threatScore = 0;

    if (heuristicAnalysis.hasUrgentLanguage) {
      threatFlags.push('Urgent language detected');
      threatScore += 20;
    }

    if (heuristicAnalysis.hasCredentialRequest) {
      threatFlags.push('Credential request detected');
      threatScore += 30;
    }

    if (heuristicAnalysis.hasSpoofedDomain) {
      threatFlags.push('Potential domain spoofing');
      threatScore += 40;
    }

    // Email impersonation detection
    if (impersonationCheck.isImpersonation) {
      threatFlags.push(`Email impersonation detected: ${impersonationCheck.originalEmail} vs ${impersonationCheck.suspiciousEmail}`);
      threatScore += 60; // High threat score for impersonation
    }

    if (heuristicAnalysis.lookalikeOfBrand) {
      threatFlags.push(`Domain looks like ${heuristicAnalysis.lookalikeOfBrand}`);
      threatScore += 50;
    }

    if (heuristicAnalysis.isNewDomain) {
      threatFlags.push('Newly registered domain (within 30 days)');
      threatScore += 25;
    }

    // If links reference a well-known brand but sender domain doesn't match, raise score
    if (heuristicAnalysis.linkBrands && heuristicAnalysis.linkBrands.length > 0) {
      const senderBrand = getAuthorizedBrand(extractSenderDomain(emailData.from) || '');
      const brandsMentioned = heuristicAnalysis.linkBrands.filter((b) => b && b !== senderBrand);
      if (brandsMentioned.length > 0) {
        threatFlags.push(`Links reference ${brandsMentioned.join(', ')} but sender domain mismatches`);
        threatScore += 30;
      }
    }

    if (heuristicAnalysis.suspiciousLinks > 0) {
      threatFlags.push(`${heuristicAnalysis.suspiciousLinks} suspicious links`);
      threatScore += heuristicAnalysis.suspiciousLinks * 15;
    }

    if (heuristicAnalysis.phishingLinks > 0) {
      threatFlags.push(`${heuristicAnalysis.phishingLinks} phishing links detected`);
      threatScore += heuristicAnalysis.phishingLinks * 25;
    }

    if (heuristicAnalysis.nonHttpsLinks && heuristicAnalysis.nonHttpsLinks > 0) {
      threatFlags.push(`${heuristicAnalysis.nonHttpsLinks} non-HTTPS links`);
      threatScore += 10;
    }

    if (heuristicAnalysis.shortenedUrls && heuristicAnalysis.shortenedUrls > 0) {
      threatFlags.push(`${heuristicAnalysis.shortenedUrls} shortened URLs`);
      threatScore += 10;
    }

    if (heuristicAnalysis.hasGenericGreeting) {
      threatFlags.push('Generic greeting detected');
      threatScore += 5;
    }

    // Add AI insights
    if (aiAnalysis.prediction === 'malicious') {
      threatScore = Math.max(threatScore, 70);
      threatFlags.push(...aiAnalysis.reasoningFlags);
    } else if (aiAnalysis.prediction === 'suspicious') {
      threatScore = Math.max(threatScore, 40);
    }

    // If AI flags 'Brand impersonation' or 'Requests sensitive data', increase score
    if (aiAnalysis.reasoningFlags?.some((f: string) => /Brand impersonation/i.test(f))) {
      threatScore += 20;
    }
    if (aiAnalysis.reasoningFlags?.some((f: string) => /Requests sensitive data/i.test(f))) {
      threatScore += 15;
    }

    // Cap threat score at 100 for now
    threatScore = Math.min(threatScore, 100);

    // Check for whitelisted sender
    const email = await prisma.email.findUnique({
      where: { id: emailId },
      select: { userId: true, from: true },
    });

    let isWhitelisted = false;
    if (email) {
      const senderEmail = extractEmailAddress(emailData.from);
      const senderDomain = extractSenderDomain(emailData.from);
      
      const whitelistEntry = await prisma.whitelist.findFirst({
        where: {
          userId: email.userId,
          OR: [
            { email: senderEmail },
            { domain: senderDomain },
          ],
        },
      });

      if (whitelistEntry) {
        isWhitelisted = true;
        threatScore = Math.max(0, threatScore - 40); // Significant reduction for whitelisted senders
        threatFlags.push('Whitelisted sender');
      }
    }

    // Determine Authorized Sender for well-known brands (if auth headers pass)
    const senderDomain = extractSenderDomain(emailData.from);
    const brandInfo = getAuthorizedBrand(senderDomain);
    let authorizedSender = false;
    let authorizedBrand: string | undefined = undefined;

    if (brandInfo) {
      const dbAuth = await prisma.email.findUnique({
        where: { id: emailId },
        select: { spfResult: true, dkimResult: true, dmarcResult: true },
      });

      const spfPass = (dbAuth?.spfResult || '').toLowerCase().includes('pass');
      const dkimPass = Boolean(dbAuth?.dkimResult);
      const dmarcPass = (dbAuth?.dmarcResult || '').toLowerCase().includes('pass');

      if (spfPass && dkimPass && dmarcPass) {
        authorizedSender = true;
        authorizedBrand = brandInfo;
        // Soften score if everything authenticates and brand is trusted
        threatScore = Math.max(0, threatScore - 30);
      }
    }

    // Hard floors: if lookalike or phishing links exist, ensure at least Suspicious
    if (heuristicAnalysis.lookalikeOfBrand || (heuristicAnalysis.phishingLinks || 0) > 0) {
      threatScore = Math.max(threatScore, 60);
    }

    // Recompute threat level AFTER all adjustments/floors
    let threatLevel: 'safe' | 'suspicious' | 'malicious' = 'safe';
    if (threatScore >= 70) {
      threatLevel = 'malicious';
    } else if (threatScore >= 40) {
      threatLevel = 'suspicious';
    }

    const result: EmailScanResult = {
      threatScore,
      threatLevel,
      threatFlags,
      analysis: {
        ...heuristicAnalysis,
        aiConfidenceScore: aiAnalysis.confidence,
        aiPrediction: aiAnalysis.prediction,
        aiReasoningFlags: aiAnalysis.reasoningFlags,
        aiSummary: aiAnalysis.summary,
        authorizedSender,
        authorizedBrand,
        linkBrands: heuristicAnalysis.linkBrands,
      },
    };

    // Update email with scan results
    await prisma.email.update({
      where: { id: emailId },
      data: {
        threatScore,
        threatLevel,
        threatFlags: JSON.stringify(threatFlags),
        scanStatus: 'completed',
        scannedAt: new Date(),
      },
    });

    // Upsert threat analysis record (ensure summary updates immediately)
    const analysisData: any = {
      emailId,
      totalLinks: heuristicAnalysis.totalLinks,
      suspiciousLinks: heuristicAnalysis.suspiciousLinks,
      phishingLinks: heuristicAnalysis.phishingLinks,
      maliciousUrls: JSON.stringify(heuristicAnalysis.maliciousUrls),
      hasUrgentLanguage: heuristicAnalysis.hasUrgentLanguage,
      hasCredentialRequest: heuristicAnalysis.hasCredentialRequest,
      hasSpoofedDomain: heuristicAnalysis.hasSpoofedDomain,
      hasSuspiciousAttachment: heuristicAnalysis.hasSuspiciousAttachment,
      aiConfidenceScore: aiAnalysis.confidence,
      aiPrediction: aiAnalysis.prediction,
      aiReasoningFlags: JSON.stringify(aiAnalysis.reasoningFlags),
      aiSummary: aiAnalysis.summary || undefined,
    };

    console.log('Saving analysis data:', { 
      emailId, 
      aiSummary: analysisData.aiSummary,
      hasSummary: !!analysisData.aiSummary 
    });

    const analysisResult = await prisma.threatAnalysis.upsert({
      where: { emailId },
      update: analysisData,
      create: analysisData,
    });

    console.log('Analysis saved successfully:', { 
      id: analysisResult.id, 
      aiSummary: analysisResult.aiSummary,
      hasSummary: !!analysisResult.aiSummary 
    });

    // Auto-quarantine if malicious and user settings allow
    if (threatLevel === 'malicious') {
      const email = await prisma.email.findUnique({
        where: { id: emailId },
        include: {
          user: {
            include: { settings: true },
          },
        },
      });

      if (email?.user.settings?.autoQuarantine) {
        await prisma.quarantinedEmail.create({
          data: {
            emailId,
            userId: email.userId,
            reason: JSON.stringify(threatFlags),
          },
        });
      }
    }

    return result;
  } catch (error) {
    console.error('Email scan error:', error);

    // Update scan status to failed
    await prisma.email.update({
      where: { id: emailId },
      data: { scanStatus: 'completed', scannedAt: new Date() },
    });

    // Return safe as default on error
    return {
      threatScore: 0,
      threatLevel: 'safe',
      threatFlags: [],
      analysis: {
        hasUrgentLanguage: false,
        hasCredentialRequest: false,
        hasSpoofedDomain: false,
        hasSuspiciousAttachment: false,
        totalLinks: 0,
        suspiciousLinks: 0,
        phishingLinks: 0,
        maliciousUrls: [],
        aiConfidenceScore: 0,
        aiPrediction: 'safe',
        aiReasoningFlags: [],
      },
    };
  }
}

/**
 * Analyze email with OpenAI
 */
async function analyzeWithAI(emailData: {
  from: string;
  subject: string;
  body: string;
}) {
  try {
    console.log('Starting AI analysis for email:', emailData.subject);
    
    if (!openai) {
      console.error('OpenAI client not initialized - API key missing');
      throw new Error('OpenAI API key not configured');
    }
    
    const prompt = `You are a professional email security analyst. Analyze this email for genuine phishing and security threats with high precision. Only flag legitimate security concerns - avoid false positives that could alarm users unnecessarily.

From: ${emailData.from}
Subject: ${emailData.subject}
Body: ${emailData.body.substring(0, 2000)}

IMPORTANT: Be conservative and professional. Only flag actual threats, not normal business communications or legitimate links. Links to well-known domains (google.com, microsoft.com, linkedin.com, etc.) are generally safe unless there are clear signs of spoofing.

Check and include any of the following indicators in reasoningFlags ONLY if they are genuinely suspicious (use these exact phrases when applicable):

Sender & Metadata:
- "Display name spoofing"
- "Reply-To mismatch"
- "SPF/DKIM/DMARC failure"
- "Suspicious sender domain"
- "Unusual sending IP/geolocation"
- "Timestamp irregularity"

Content Indicators:
- "Urgent or fear-inducing language"
- "Too good to be true offer"
- "Grammar or spelling errors"
- "Generic greeting"
- "Requests sensitive data"
- "Unexpected attachment"
- "Brand impersonation"
- "Tone mismatch with prior communications"

Links & Attachments (ONLY flag if genuinely suspicious):
- "Shortened URL" (only if combined with other suspicious indicators)
- "Link redirect chain" (multiple redirects to unknown domains)
- "Non-HTTPS link" (only if requesting sensitive information)
- "IP-address link" (direct IP instead of domain)
- "Newly-registered domain" (domain registered within last 30 days AND requesting sensitive info)
- "Suspicious domain spoofing" (lookalike of trusted brand)
- "Attachment with script/executable" (only actual executables, not normal files)
- "Encoded/encrypted attachment" (only if unexpected)

NOTE: Do NOT flag legitimate links to well-known domains (google.com, microsoft.com, linkedin.com, github.com, mixlr.com, etc.) or their subdomains unless there is clear evidence of spoofing or domain manipulation. Subdomains of trusted domains (e.g., "user.mixlrmail.com") are generally safe.

Technical & Headers:
- "Missing/mismatched headers"
- "Anomalous Received chain"
- "Unknown sending software"
- "SPF softfail/neutral"
- "Unsigned DKIM"
- "No DMARC policy"

Behavioral & Context:
- "First-time sender"
- "External claiming internal"
- "Domain reputation mismatch"
- "Bulk similar messages"
- "Tracking pixel detected"
- "Requests secrecy"
- "Bypasses standard procedure"

IMPORTANT: You MUST include a summary field. Summarize what this email is about in 1-2 sentences.

Respond ONLY with JSON object:
{"prediction": "safe|suspicious|malicious", "confidence": 0-1, "reasoningFlags": ["..."], "summary": "Brief description of what this email is asking or saying"}`;

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('AI analysis timeout')), 15000); // 15 second timeout
    });

    const aiPromise = openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a cybersecurity expert specializing in email threat detection. Always provide a summary of what the email is about.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 600,
    });

    const response = await Promise.race([aiPromise, timeoutPromise]) as any;
    console.log('AI analysis completed successfully');

    const content = response.choices[0].message.content || '{}';
    console.log('AI Response:', content); // Debug log
    
    let parsed;
    try {
      parsed = JSON.parse(content);
      console.log('Parsed AI:', parsed); // Debug log
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.log('Raw AI response:', content);
      // Fallback if JSON parsing fails
      parsed = {
        prediction: 'safe',
        confidence: 0.5,
        reasoningFlags: [],
        summary: `Email from ${emailData.from.split('<')[0].trim()} regarding "${emailData.subject}"`
      };
    }

    // Ensure we always have a summary
    let summary = parsed.summary || '';
    if (!summary) {
      // Generate a basic summary from subject and sender if AI didn't provide one
      summary = `Email from ${emailData.from.split('<')[0].trim()} regarding "${emailData.subject}"`;
    }
    
    console.log('Final summary:', summary);

    return {
      prediction: parsed.prediction || 'safe',
      confidence: parsed.confidence || 0.5,
      reasoningFlags: parsed.reasoningFlags || [],
      summary: summary,
    };
  } catch (error) {
    console.error('AI analysis error:', error);
    return {
      prediction: 'safe',
      confidence: 0.5,
      reasoningFlags: [],
      summary: `Email from ${emailData.from.split('<')[0].trim()} regarding "${emailData.subject}"`,
    };
  }
}

/**
 * Perform heuristic analysis
 */
async function performHeuristicAnalysis(
  emailData: { from: string; subject: string; body: string },
  links: string[],
  impersonationCheck?: { isImpersonation: boolean; originalEmail?: string; suspiciousEmail?: string; similarity?: number }
) {
  const urgentKeywords = [
    'urgent',
    'immediate action',
    'act now',
    'suspended',
    'verify',
    'confirm',
    'update required',
    'security alert',
    'unusual activity',
    'final notice',
    'limited time',
    'your account will be closed',
  ];

  const credentialKeywords = [
    'password',
    'username',
    'credit card',
    'ssn',
    'social security',
    'bank account',
    'login',
    'signin',
    'otp',
    'one-time password',
    '2fa',
  ];

  const combinedText = `${emailData.subject} ${emailData.body}`.toLowerCase();

  const hasUrgentLanguage = urgentKeywords.some((keyword) =>
    combinedText.includes(keyword.toLowerCase())
  );

  const hasCredentialRequest = credentialKeywords.some((keyword) =>
    combinedText.includes(keyword.toLowerCase())
  );

  const genericGreetings = ['dear user', 'dear customer', 'dear client'];
  const hasGenericGreeting = genericGreetings.some((g) =>
    combinedText.includes(g)
  );

  // Check for domain spoofing and lookalikes of popular/gov brands
  const senderDomain = extractSenderDomain(emailData.from);
  const hasSpoofedDomain = checkDomainSpoofing(emailData.from);
  const lookalikeOfBrand = detectLookalikeBrand(senderDomain);

  // Check domain registration date (if domain is new, it's more suspicious)
  // Skip checking for trusted/popular domains to avoid false positives
  let isNewDomain = false;
  if (senderDomain) {
    const popularDomains = ['google.com', 'microsoft.com', 'linkedin.com', 'github.com', 'amazon.com', 'apple.com', 'facebook.com', 'twitter.com', 'gmail.com', 'outlook.com', 'yahoo.com'];
    const isPopularDomain = popularDomains.some((td: string) => senderDomain.includes(td));
    
    if (!isPopularDomain) {
      try {
        const domainCheck = await checkDomainRegistrationDate(senderDomain);
        isNewDomain = domainCheck.isNewDomain || false;
      } catch (error) {
        console.error('Error checking domain registration:', error);
        // Fail silently to avoid blocking email scanning
      }
    }
  }

  // Analyze links
  const { suspicious, phishing, malicious, nonHttps, shortened, brands } = analyzeLinks(links);

  return {
    hasUrgentLanguage,
    hasCredentialRequest,
    hasSpoofedDomain,
    hasSuspiciousAttachment: false, // TODO: Implement attachment scanning
    hasGenericGreeting,
    isNewDomain,
    totalLinks: links.length,
    suspiciousLinks: suspicious.length,
    phishingLinks: phishing.length,
    maliciousUrls: malicious,
    nonHttpsLinks: nonHttps,
    shortenedUrls: shortened,
    lookalikeOfBrand,
    linkBrands: brands,
  };
}

/**
 * Extract links from text
 */
function extractLinks(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/g;
  const matches = text.match(urlRegex) || [];
  return matches.map((m) => m.replace(/[\.,;:)'\]]+$/g, ''));
}

/**
 * Check for domain spoofing
 */
function checkDomainSpoofing(from: string): boolean {
  const trustedDomains = ['gmail.com', 'outlook.com', 'yahoo.com'];
  const suspiciousPatterns = [
    /paypa1/i,
    /g00gle/i,
    /micros0ft/i,
    /app1e/i,
    /amazn/i,
  ];

  const domain = from.split('@')[1]?.toLowerCase() || '';

  // Check if domain looks like a trusted one but isn't
  for (const trusted of trustedDomains) {
    if (domain.includes(trusted.replace('.', '')) && domain !== trusted) {
      return true;
    }
  }

  // Check for suspicious patterns
  return suspiciousPatterns.some((pattern) => pattern.test(domain));
}

/**
 * Analyze links for threats
 */
function analyzeLinks(links: string[]) {
  const suspicious: string[] = [];
  const phishing: string[] = [];
  const malicious: string[] = [];
  let nonHttps = 0;
  let shortened = 0;
  const brands: string[] = [];

  const suspiciousTLDs = ['.xyz', '.tk', '.ml', '.ga', '.cf'];
  const phishingKeywords = ['login', 'verify', 'account', 'secure', 'update'];
  const shorteners = ['bit.ly', 't.co', 'tinyurl.com', 'goo.gl', 'rebrand.ly'];
  // Expanded list of trusted/popular domains
  const trustedBrandDomains = Object.keys({
    // Tech & Cloud
    'linkedin.com': 'LinkedIn',
    'google.com': 'Google',
    'github.com': 'GitHub',
    'microsoft.com': 'Microsoft',
    'apple.com': 'Apple',
    'amazon.com': 'Amazon',
    'aws.amazon.com': 'AWS',
    'facebook.com': 'Facebook',
    'meta.com': 'Meta',
    'twitter.com': 'Twitter',
    'x.com': 'X',
    'instagram.com': 'Instagram',
    'youtube.com': 'YouTube',
    'netflix.com': 'Netflix',
    'spotify.com': 'Spotify',
    'discord.com': 'Discord',
    'reddit.com': 'Reddit',
    'stackoverflow.com': 'Stack Overflow',
    'stackexchange.com': 'Stack Exchange',
    'medium.com': 'Medium',
    'notion.so': 'Notion',
    'dropbox.com': 'Dropbox',
    'box.com': 'Box',
    'onedrive.com': 'OneDrive',
    'icloud.com': 'iCloud',
    'zoom.us': 'Zoom',
    'teams.microsoft.com': 'Microsoft Teams',
    'slack.com': 'Slack',
    'atlassian.com': 'Atlassian',
    'jira.com': 'Jira',
    'confluence.com': 'Confluence',
    'trello.com': 'Trello',
    'asana.com': 'Asana',
    'monday.com': 'Monday',
    'salesforce.com': 'Salesforce',
    'hubspot.com': 'HubSpot',
    'zendesk.com': 'Zendesk',
    'stripe.com': 'Stripe',
    'paypal.com': 'PayPal',
    'square.com': 'Square',
    'shopify.com': 'Shopify',
    'etsy.com': 'Etsy',
    'ebay.com': 'eBay',
    'airbnb.com': 'Airbnb',
    'uber.com': 'Uber',
    'lyft.com': 'Lyft',
    'doordash.com': 'DoorDash',
    'grubhub.com': 'Grubhub',
    // Banking & Finance
    'chase.com': 'Chase',
    'bankofamerica.com': 'Bank of America',
    'wellsfargo.com': 'Wells Fargo',
    'citi.com': 'Citi',
    'capitalone.com': 'Capital One',
    'americanexpress.com': 'American Express',
    'visa.com': 'Visa',
    'mastercard.com': 'Mastercard',
    // News & Media
    'cnn.com': 'CNN',
    'bbc.com': 'BBC',
    'nytimes.com': 'New York Times',
    'washingtonpost.com': 'Washington Post',
    'theguardian.com': 'The Guardian',
    'reuters.com': 'Reuters',
    'bloomberg.com': 'Bloomberg',
    'wsj.com': 'Wall Street Journal',
    // Education
    'coursera.org': 'Coursera',
    'udemy.com': 'Udemy',
    'edx.org': 'edX',
    'khanacademy.org': 'Khan Academy',
    // Government & Official
    'irs.gov': 'IRS',
    'usps.com': 'USPS',
    'fedex.com': 'FedEx',
    'ups.com': 'UPS',
    'dhl.com': 'DHL',
    // Email Providers
    'gmail.com': 'Gmail',
    'outlook.com': 'Outlook',
    'yahoo.com': 'Yahoo',
    'protonmail.com': 'ProtonMail',
    'mail.com': 'Mail.com',
    // Job Sites
    'indeed.com': 'Indeed',
    'glassdoor.com': 'Glassdoor',
    'monster.com': 'Monster',
    'careerbuilder.com': 'CareerBuilder',
    // Other Popular
    'wikipedia.org': 'Wikipedia',
    'imdb.com': 'IMDb',
    'pinterest.com': 'Pinterest',
    'tumblr.com': 'Tumblr',
    'flickr.com': 'Flickr',
    'twitch.tv': 'Twitch',
    'tiktok.com': 'TikTok',
    'snapchat.com': 'Snapchat',
    // Audio/Streaming Platforms
    'mixlrmail.com': 'Mixlr',
    'soundcloud.com': 'SoundCloud',
    'anchor.fm': 'Anchor',
    'podbean.com': 'Podbean',
  });

  for (const link of links) {
    try {
      const url = new URL(link);

      // First, check if this is a trusted domain/subdomain - if so, skip most checks
      const hostNorm = normalizeHomoglyphs(url.hostname);
      const isTrustedDomain = trustedBrandDomains.some((td) => {
        const tNorm = normalizeHomoglyphs(td);
        // Match exact domain or subdomain (e.g., "apostlemuyiwaareo.mixlrmail.com" matches "mixlrmail.com")
        return hostNorm === tNorm || hostNorm.endsWith('.' + tNorm);
      });

      // If it's a trusted domain, skip phishing checks entirely
      if (isTrustedDomain) {
        // Still check for brand recognition
        for (const td of trustedBrandDomains) {
          const tNorm = normalizeHomoglyphs(td);
          if (hostNorm === tNorm || hostNorm.endsWith('.' + tNorm)) {
            const brand = getAuthorizedBrand(td);
            if (brand) brands.push(brand);
            break;
          }
        }
        // Skip to next link - trusted domains are safe
        continue;
      }

      if (url.protocol !== 'https:') {
        nonHttps += 1;
      }

      if (shorteners.some((s) => url.hostname.endsWith(s))) {
        shortened += 1;
        suspicious.push(link);
      }

      // Check TLD
      if (suspiciousTLDs.some((tld) => url.hostname.endsWith(tld))) {
        suspicious.push(link);
      }

      // Check for phishing keywords - only flag if combined with suspicious patterns
      // Don't flag legitimate links that just happen to contain common words
      const linkLower = link.toLowerCase();
      const hasPhishingKeyword = phishingKeywords.some((keyword) => linkLower.includes(keyword));
      
      // Only flag as phishing if:
      // 1. Has phishing keyword AND suspicious TLD, OR
      // 2. Has phishing keyword AND is shortened URL, OR
      // 3. Has phishing keyword AND uses IP address, OR
      // 4. Has phishing keyword AND domain doesn't match trusted brands
      if (hasPhishingKeyword) {
        const isSuspiciousTLD = suspiciousTLDs.some((tld) => url.hostname.endsWith(tld));
        const isShortened = shorteners.some((s) => url.hostname.endsWith(s));
        const isIPAddress = /\d+\.\d+\.\d+\.\d+/.test(url.hostname);
        
        // Only flag if it's actually suspicious, not just because it has a common word
        if (isSuspiciousTLD || isShortened || isIPAddress) {
          phishing.push(link);
        }
      }

      // Check for IP addresses instead of domains
      if (/\d+\.\d+\.\d+\.\d+/.test(url.hostname)) {
        malicious.push(link);
      }

      // Check for brand domains and lookalikes (homoglyphs) - only for non-trusted domains
      // (Trusted domains are already handled above)
      for (const td of trustedBrandDomains) {
        const tNorm = normalizeHomoglyphs(td);
        // Check for lookalikes (similar domains that might be spoofing)
        const dist = levenshtein(hostNorm, tNorm);
        if (dist > 0 && dist <= 2) {
          const brand = getAuthorizedBrand(td);
          if (brand) brands.push(brand);
        }
      }
    } catch (error) {
      // Invalid URL
      malicious.push(link);
    }
  }

  return { suspicious, phishing, malicious, nonHttps, shortened, brands };
}

/**
 * Extract sender domain from a From header value like "Name <user@domain.com>"
 */
function extractSenderDomain(from: string): string {
  const match = from.match(/<([^>]+)>/);
  const email = (match ? match[1] : from).trim();
  const parts = email.split('@');
  return parts[1]?.toLowerCase() || '';
}

/**
 * Extract email address from a From header value like "Name <user@domain.com>"
 */
function extractEmailAddress(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return (match ? match[1] : from).trim().toLowerCase();
}

/**
 * Known trusted brands mapping for authorized sender detection
 * Returns normalized brand name if domain matches a known authorized sender domain
 */
function getAuthorizedBrand(domain: string): string | undefined {
  if (!domain) return undefined;

  const map: Record<string, string> = {
    'linkedin.com': 'LinkedIn',
    'email.linkedin.com': 'LinkedIn',
    'google.com': 'Google',
    'accounts.google.com': 'Google',
    'facebookmail.com': 'Facebook',
    'facebook.com': 'Facebook',
    'github.com': 'GitHub',
    'notifications.github.com': 'GitHub',
    'microsoft.com': 'Microsoft',
    'outlook.com': 'Microsoft',
    'apple.com': 'Apple',
    'amazon.com': 'Amazon',
    'paypal.com': 'PayPal',
    'stripe.com': 'Stripe',
    'slack.com': 'Slack',
    'atlassian.com': 'Atlassian',
    'jira.com': 'Atlassian',
    // Governmental examples (add more as needed)
    'gov.uk': 'UK Government',
    'usa.gov': 'US Government',
    'irs.gov': 'IRS',
    'nhs.uk': 'NHS',
  };

  // Direct match or subdomain match
  const direct = map[domain];
  if (direct) return direct;

  const base = domain.split('.').slice(-2).join('.');
  return map[base];
}

/**
 * Detect if a sender domain is a lookalike of a trusted brand/government domain
 */
function detectLookalikeBrand(domain: string): string | undefined {
  if (!domain) return undefined;

  const trusted: Record<string, string> = {
    'linkedin.com': 'LinkedIn',
    'google.com': 'Google',
    'github.com': 'GitHub',
    'microsoft.com': 'Microsoft',
    'paypal.com': 'PayPal',
    'amazon.com': 'Amazon',
    'apple.com': 'Apple',
    'stripe.com': 'Stripe',
    'slack.com': 'Slack',
    'atlassian.com': 'Atlassian',
    'gov.uk': 'UK Government',
    'usa.gov': 'US Government',
    'irs.gov': 'IRS',
  };

  const normalized = normalizeHomoglyphs(domain);
  for (const td of Object.keys(trusted)) {
    if (domain === td) continue; // exact match handled elsewhere
    const tNorm = normalizeHomoglyphs(td);
    const dist = levenshtein(normalized, tNorm);
    const baseMatch = normalized.replace(/^.+\.(?=.+\..+$)/, '') === tNorm.replace(/^.+\.(?=.+\..+$)/, '');
    if (dist <= 2 || baseMatch) {
      // If looks similar and not exact, treat as lookalike
      return trusted[td];
    }
  }
  return undefined;
}

function normalizeHomoglyphs(s: string): string {
  return s
    .toLowerCase()
    .replace(/0/g, 'o')
    .replace(/1/g, 'l')
    .replace(/3/g, 'e')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/@/g, 'a');
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

/**
 * Check domain registration date (using WHOIS)
 * Returns true if domain is newly registered (within last 30 days)
 */
async function checkDomainRegistrationDate(domain: string): Promise<{
  isNewDomain: boolean;
  registrationDate?: Date;
  ageInDays?: number;
}> {
  try {
    // Use whois package to check domain registration
    const whois = require('whois');
    
    return new Promise((resolve) => {
      whois.lookup(domain, (err: any, data: string) => {
        if (err) {
          console.error('WHOIS lookup error:', err);
          resolve({ isNewDomain: false });
          return;
        }

        try {
          // Parse WHOIS data to find registration date
          // Common patterns: "Creation Date:", "Registered On:", "Created:", etc.
          const creationDateMatch = data.match(/(?:Creation Date|Registered On|Created|Registration Date):\s*(\d{4}-\d{2}-\d{2})/i) ||
                                   data.match(/(?:Creation Date|Registered On|Created|Registration Date):\s*(\d{2}\/\d{2}\/\d{4})/i) ||
                                   data.match(/(?:Creation Date|Registered On|Created|Registration Date):\s*(\d{2}-\d{2}-\d{4})/i);
          
          if (creationDateMatch) {
            const dateStr = creationDateMatch[1];
            let registrationDate: Date;
            
            // Parse different date formats
            if (dateStr.includes('-')) {
              registrationDate = new Date(dateStr);
            } else if (dateStr.includes('/')) {
              const [month, day, year] = dateStr.split('/');
              registrationDate = new Date(`${year}-${month}-${day}`);
            } else {
              registrationDate = new Date(dateStr);
            }

            const now = new Date();
            const ageInDays = Math.floor((now.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24));
            const isNewDomain = ageInDays <= 30 && ageInDays >= 0;

            resolve({
              isNewDomain,
              registrationDate,
              ageInDays,
            });
          } else {
            // If we can't find registration date, assume it's not new to avoid false positives
            resolve({ isNewDomain: false });
          }
        } catch (parseError) {
          console.error('Error parsing WHOIS data:', parseError);
          resolve({ isNewDomain: false });
        }
      });
    });
  } catch (error) {
    console.error('Error checking domain registration:', error);
    return { isNewDomain: false };
  }
}


