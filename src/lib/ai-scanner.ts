import OpenAI from 'openai';
import { prisma } from './prisma';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface EmailScanResult {
  threatScore: number; // 0-100
  threatLevel: 'safe' | 'suspicious' | 'malicious';
  threatFlags: string[];
  analysis: {
    hasUrgentLanguage: boolean;
    hasCredentialRequest: boolean;
    hasSpoofedDomain: boolean;
    hasSuspiciousAttachment: boolean;
    totalLinks: number;
    suspiciousLinks: number;
    phishingLinks: number;
    maliciousUrls: string[];
    aiConfidenceScore: number;
    aiPrediction: string;
    aiReasoningFlags: string[];
  };
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
  }
): Promise<EmailScanResult> {
  try {
    // Update scan status
    await prisma.email.update({
      where: { id: emailId },
      data: { scanStatus: 'scanning' },
    });

    // Extract links from email
    const links = extractLinks(emailData.body + (emailData.htmlBody || ''));

    // Analyze with OpenAI
    const aiAnalysis = await analyzeWithAI(emailData);

    // Perform heuristic checks
    const heuristicAnalysis = performHeuristicAnalysis(emailData, links);

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

    if (heuristicAnalysis.suspiciousLinks > 0) {
      threatFlags.push(`${heuristicAnalysis.suspiciousLinks} suspicious links`);
      threatScore += heuristicAnalysis.suspiciousLinks * 15;
    }

    if (heuristicAnalysis.phishingLinks > 0) {
      threatFlags.push(`${heuristicAnalysis.phishingLinks} phishing links detected`);
      threatScore += heuristicAnalysis.phishingLinks * 25;
    }

    // Add AI insights
    if (aiAnalysis.prediction === 'malicious') {
      threatScore = Math.max(threatScore, 70);
      threatFlags.push(...aiAnalysis.reasoningFlags);
    } else if (aiAnalysis.prediction === 'suspicious') {
      threatScore = Math.max(threatScore, 40);
    }

    // Cap threat score at 100
    threatScore = Math.min(threatScore, 100);

    // Determine threat level
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

    // Create threat analysis record
    await prisma.threatAnalysis.create({
      data: {
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
      },
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
    const prompt = `Analyze this email for phishing and security threats:

From: ${emailData.from}
Subject: ${emailData.subject}
Body: ${emailData.body.substring(0, 2000)}

Analyze for:
1. Phishing attempts
2. Urgent/threatening language
3. Credential requests
4. Domain spoofing
5. Social engineering tactics

Respond with a JSON object containing:
- prediction: "safe", "suspicious", or "malicious"
- confidence: 0.0 to 1.0
- reasoningFlags: array of specific concerns found`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a cybersecurity expert specializing in email threat detection.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const content = response.choices[0].message.content || '{}';
    const parsed = JSON.parse(content);

    return {
      prediction: parsed.prediction || 'safe',
      confidence: parsed.confidence || 0.5,
      reasoningFlags: parsed.reasoningFlags || [],
    };
  } catch (error) {
    console.error('AI analysis error:', error);
    return {
      prediction: 'safe',
      confidence: 0.5,
      reasoningFlags: [],
    };
  }
}

/**
 * Perform heuristic analysis
 */
function performHeuristicAnalysis(
  emailData: { from: string; subject: string; body: string },
  links: string[]
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
  ];

  const combinedText = `${emailData.subject} ${emailData.body}`.toLowerCase();

  const hasUrgentLanguage = urgentKeywords.some((keyword) =>
    combinedText.includes(keyword.toLowerCase())
  );

  const hasCredentialRequest = credentialKeywords.some((keyword) =>
    combinedText.includes(keyword.toLowerCase())
  );

  // Check for domain spoofing
  const hasSpoofedDomain = checkDomainSpoofing(emailData.from);

  // Analyze links
  const { suspicious, phishing, malicious } = analyzeLinks(links);

  return {
    hasUrgentLanguage,
    hasCredentialRequest,
    hasSpoofedDomain,
    hasSuspiciousAttachment: false, // TODO: Implement attachment scanning
    totalLinks: links.length,
    suspiciousLinks: suspicious.length,
    phishingLinks: phishing.length,
    maliciousUrls: malicious,
  };
}

/**
 * Extract links from text
 */
function extractLinks(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/g;
  return text.match(urlRegex) || [];
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

  const suspiciousTLDs = ['.xyz', '.tk', '.ml', '.ga', '.cf'];
  const phishingKeywords = ['login', 'verify', 'account', 'secure', 'update'];

  for (const link of links) {
    try {
      const url = new URL(link);

      // Check TLD
      if (suspiciousTLDs.some((tld) => url.hostname.endsWith(tld))) {
        suspicious.push(link);
      }

      // Check for phishing keywords
      if (phishingKeywords.some((keyword) => link.toLowerCase().includes(keyword))) {
        phishing.push(link);
      }

      // Check for IP addresses instead of domains
      if (/\d+\.\d+\.\d+\.\d+/.test(url.hostname)) {
        malicious.push(link);
      }
    } catch (error) {
      // Invalid URL
      malicious.push(link);
    }
  }

  return { suspicious, phishing, malicious };
}

