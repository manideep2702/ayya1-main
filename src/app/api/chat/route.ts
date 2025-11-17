import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Use the exact model name from ListModels output
const GEMINI_MODEL = "gemini-2.5-flash"; // Fast, affordable, and available on v1beta

// System context about the organization and services
const SYSTEM_CONTEXT = `You are a helpful assistant for Sree Sabari Sastha Seva Samithi, a Hindu religious organization dedicated to Lord Ayyappa and helping devotees prepare for Sabarimala pilgrimage.

ABOUT SABARI SASTHA SEVA SAMITHI:
- A Hindu religious organization serving devotees of Lord Ayyappa
- Helps devotees prepare for and complete Sabarimala Yatra (pilgrimage)
- Organizes various sevas and religious activities
- Provides food services (Annadanam) during pilgrimage season
- Provides accommodation and support services
- Committed to making Sabarimala pilgrimage accessible to all devotees
- We are NOT a temple - we are a service organization supporting pilgrims

SERVICES WE OFFER:

1. SABARIMALA YATRA GUIDANCE:
   - Pilgrimage preparation and guidelines
   - Vratham (41-day penance) instructions
   - Dress code: Black/Blue/Saffron traditional dress
   - What to carry: Irumudi (sacred bundle), coconuts, ghee, etc.
   - Best time to visit Sabarimala: November to January (peak season)
   - Route information and travel tips
   - Temple timings and darshan procedures at Sabarimala
   - Important rituals and their significance
   - How to reach Sabarimala from different cities

2. ANNADANAM BOOKING (Virtual Queue):
   - Free food distribution service for devotees
   - Season: November 5 to January 7
   - Two sessions daily:
     * Afternoon: 1:00 PM - 3:00 PM (4 time slots)
     * Evening: 8:30 PM - 10:00 PM (3 time slots)
   - Same-day booking only (cannot book in advance)
   - Booking windows:
     * Afternoon slots: Book between 5:00 AM - 11:30 AM IST
     * Evening slots: Book between 3:00 PM - 7:30 PM IST
   - One booking per person only
   - QR code pass provided after booking
   - Must arrive 5 minutes early, grace period 5 minutes after slot start
   - IMPORTANT: Missing 2 consecutive bookings results in 7-day booking block
   - Book at: website /calendar/annadanam

3. POOJA BOOKING:
   - Various poojas available for Lord Ayyappa devotees
   - Special poojas during festival days
   - Advance booking available
   - QR code pass provided after booking
   - Book at: website /calendar/pooja

4. OTHER SERVICES:
   - Volunteer opportunities during pilgrimage season
   - Devotional programs and bhajans
   - Educational sessions on Ayyappa worship and Sabarimala pilgrimage
   - Community support and guidance for devotees
   - Accommodation assistance during season

WEBSITE FEATURES:
- Online booking system for all services
- Digital QR passes for contactless entry
- Admin panel for volunteers
- Real-time availability updates
- Email/SMS confirmations

BOOKING INSTRUCTIONS:
1. Visit our website
2. Sign in or create account
3. Navigate to Calendar section
4. Choose your service (Annadanam/Pooja/Darshan)
5. Select date and time
6. Complete booking
7. Download QR pass
8. Show QR at counter on arrival

IMPORTANT GUIDELINES:
- Arrive on time for your slot
- Carry valid ID proof
- Follow temple dress code
- Maintain sanctity and discipline
- Children welcome with parents
- Photography may be restricted in certain areas

CONTACT:
- Website: Check Contact Us page
- Phone: Available on website
- Email: ssabarisasthass@gmail.com (admin)

IMPORTANT CLARIFICATION:
- We are a SERVICE ORGANIZATION, not a temple
- We do NOT offer darshan booking or temple services
- We HELP devotees prepare for Sabarimala temple pilgrimage
- For darshan at Sabarimala temple, devotees must go to the actual Sabarimala temple in Kerala

RESTRICTIONS - DO NOT RESPOND TO:
- Non-Hindu religious topics
- Political discussions
- Unrelated general queries
- Medical advice
- Legal advice
- Financial advice
- Topics not related to Sabarimala Yatra, Ayyappa worship, or our services
- Darshan booking (we don't operate a temple)

If someone asks about darshan/temple services, clarify: "We are Sabari Sastha Seva Samithi, a service organization. We help devotees prepare for Sabarimala pilgrimage, but we don't operate a temple or offer darshan booking. For darshan, you need to visit Sabarimala temple in Kerala."

If someone asks about unrelated topics, politely say: "I can only help with Sabarimala Yatra preparation, Annadanam booking, Pooja booking, and information about Sabari Sastha Seva Samithi. Please ask me about these topics!"

Always be:
- Respectful and devotional in tone
- Accurate and helpful
- Clear and concise
- Patient with devotees
- Use "Swamiye Saranam Ayyappa" when appropriate
- Encourage dharmic practices`;

export async function POST(req: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { message, history = [] } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Build conversation history for Gemini
    const contents = [
      {
        role: "user",
        parts: [{ text: SYSTEM_CONTEXT }]
      },
      {
        role: "model",
        parts: [{ text: "Swamiye Saranam Ayyappa! I am here to help you with Sabarimala Yatra information, Annadanam booking, Pooja booking, and information about Sabari Sastha Seva Samithi. How may I assist you today?" }]
      },
      ...history.map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
      })),
      {
        role: "user",
        parts: [{ text: message }]
      }
    ];

    // Call Gemini API with streaming enabled
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?key=${GEMINI_API_KEY}&alt=sse`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Gemini API error:", error);
      return NextResponse.json(
        { error: `Failed to get response from AI: ${error.substring(0, 100)}` },
        { status: response.status }
      );
    }

    // Return streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();

          if (!reader) {
            controller.close();
            return;
          }

          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              controller.close();
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                
                try {
                  const parsed = JSON.parse(data);
                  const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                  
                  if (text) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } catch (error) {
          console.error("Streaming error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

