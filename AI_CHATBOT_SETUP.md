# AI Chatbot Setup Guide

## 🤖 Gemini-Powered Chatbot for Sabarimala Yatra & Bookings

A focused AI assistant that ONLY helps with:
- Sabarimala Yatra information
- Annadanam booking
- Pooja booking  
- Darshan booking
- Sabari Sastha Seva Samithi information

**It will NOT respond to unrelated topics!**

---

## 🚀 Setup Instructions

### Step 1: Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Get API Key"** or **"Create API Key"**
4. Copy the API key (starts with `AIza...`)

### Step 2: Add to Environment Variables

Add this to your `.env.local` file:

```bash
GEMINI_API_KEY=AIzaSyB2SCYKRDYTO-2lOHWXATPdRiJx52knHuM
```

### Step 3: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 4: Test the Chatbot!

1. Visit your website (any page)
2. Look for the **"Ask AI Assistant"** button in bottom-right corner
3. Click it to open the chat
4. Try asking:
   - "How do I book Annadanam?"
   - "Tell me about Sabarimala Yatra"
   - "What is the dress code for Sabarimala?"
   - "How to book Pooja?"

---

## ✅ Features

### ✨ What the Chatbot Can Do

1. **Sabarimala Yatra Guidance**
   - Pilgrimage preparation tips
   - Vratham (41-day penance) instructions
   - Dress code information
   - What to carry (Irumudi, etc.)
   - Temple timings and rituals
   - Route and travel information

2. **Annadanam Booking Help**
   - Explain booking process
   - Session timings
   - Booking windows
   - QR code system
   - Rules and restrictions
   - Blocking policy (2 consecutive no-shows)

3. **Pooja Booking Assistance**
   - Available poojas
   - Booking process
   - Special festival poojas
   - Advance booking info

4. **Darshan Information**
   - Virtual queue system
   - Best times to visit
   - Special darshan options
   - Booking process

5. **Organization Information**
   - About Sabari Sastha Seva Samithi
   - Services offered
   - Volunteer opportunities
   - Contact information

### 🚫 What It Will NOT Do

The chatbot is strictly limited to the above topics. It will politely decline:
- Non-Hindu religious topics
- Political discussions
- General questions unrelated to Sabarimala
- Medical or legal advice
- Financial advice
- Any topics outside its scope

---

## 🎨 UI Features

### Floating Chat Button
- **Location**: Bottom-right corner
- **Design**: Purple gradient, modern look
- **Text**: "Ask AI Assistant"
- **Icon**: Message bubble with green online indicator

### Chat Window
- **Size**: 400px wide, 600px tall (responsive on mobile)
- **Style**: Clean, modern interface
- **Colors**: Purple/indigo gradient header
- **Messages**: 
  - User messages: Right-aligned, purple
  - AI messages: Left-aligned, muted background
  - Timestamps for each message

### Quick Action Buttons
Shows common queries as quick-click buttons:
- Annadanam Booking
- Yatra Info
- Pooja Booking
- Dress Code

### Features
- ✅ Real-time typing indicator
- ✅ Message history maintained during session
- ✅ Auto-scroll to latest message
- ✅ Keyboard shortcut (Enter to send)
- ✅ Mobile responsive
- ✅ Smooth animations

---

## 📁 Files Created

### Backend (API)
```
src/app/api/chat/route.ts
```
- Edge runtime for fast response
- Gemini API integration
- System prompt with organization context
- Conversation history management
- Error handling
- Safety settings

### Frontend (Component)
```
src/components/chat/AIChatbot.tsx
```
- Floating chat widget
- Message display
- User input handling
- Loading states
- Quick actions
- Responsive design

### Configuration
```
src/components/Providers.tsx (updated)
.env.example (updated)
AI_CHATBOT_SETUP.md (this file)
```

---

## 🔧 Configuration Options

### Adjust AI Behavior

In `src/app/api/chat/route.ts`, you can modify:

```typescript
// Change the AI model
const GEMINI_MODEL = "gemini-1.5-flash"; // Fast, cheaper
// or
const GEMINI_MODEL = "gemini-1.5-pro";   // Smarter, more expensive

// Adjust response style
generationConfig: {
  temperature: 0.7,    // 0.0 = focused, 1.0 = creative
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 1024, // Max response length
}
```

### Update System Context

Edit the `SYSTEM_CONTEXT` constant to:
- Add new information
- Update timings
- Change contact details
- Add new services
- Modify tone/style

---

## 🧪 Testing

### Test Questions

**Sabarimala Yatra:**
```
- "How do I prepare for Sabarimala Yatra?"
- "What is the dress code?"
- "What should I carry in my Irumudi?"
- "When is the best time to visit?"
- "Tell me about the 41-day vratham"
```

**Annadanam:**
```
- "How do I book Annadanam?"
- "What are the timings?"
- "Can I book for tomorrow?"
- "What happens if I don't show up?"
- "How many people can I book for?"
```

**Pooja:**
```
- "What poojas are available?"
- "How to book pooja online?"
- "Can I book advance pooja?"
- "Do I need to visit in person?"
```

**Off-Topic (Should Decline):**
```
- "What is the weather today?"
- "Who is the Prime Minister?"
- "Tell me a joke"
- "Help me with my homework"
```

### Expected Behavior

✅ **ON-TOPIC**: Helpful, detailed, devotional responses
❌ **OFF-TOPIC**: "I can only help with Sabarimala Yatra, Annadanam/Pooja bookings..."

---

## 💰 Cost Estimation

### Gemini API Pricing (as of 2024)

**Gemini 1.5 Flash (Recommended):**
- Input: $0.075 per 1M tokens
- Output: $0.30 per 1M tokens
- **Very affordable** - Thousands of chats for pennies!

**Gemini 1.5 Pro (Higher Quality):**
- Input: $1.25 per 1M tokens  
- Output: $5.00 per 1M tokens
- Still very reasonable

### Example Usage
- 1000 conversations/day
- ~500 tokens per conversation
- **Cost**: ~$15-30/month (Flash model)

**Free Tier**: Google AI Studio includes generous free quota for testing!

---

## 🛠️ Customization

### Change Chat Position

In `AIChatbot.tsx`:
```typescript
// Button position
className="fixed bottom-6 right-6..."

// Change to left side:
className="fixed bottom-6 left-6..."

// Change to top:
className="fixed top-20 right-6..."
```

### Change Colors

Update the gradient colors:
```typescript
// From purple to your brand color
className="...from-purple-600 to-indigo-600..."
// Change to:
className="...from-orange-600 to-amber-600..."
```

### Add More Quick Actions

In the `QuickActions` component:
```typescript
<button onClick={() => setInput("Your question here")}>
  Button Text
</button>
```

### Modify Welcome Message

In `AIChatbot.tsx`, change the initial message:
```typescript
const [messages, setMessages] = useState<Message[]>([
  {
    role: "assistant",
    content: "Your custom welcome message here!",
    timestamp: new Date()
  }
]);
```

---

## 🐛 Troubleshooting

### Chatbot Button Not Showing
1. Check if `GEMINI_API_KEY` is set in `.env.local`
2. Restart dev server: `npm run dev`
3. Check browser console for errors
4. Verify `Providers.tsx` includes `<AIChatbot />`

### AI Not Responding
1. Check API key is valid (not expired)
2. Check browser console for error messages
3. Verify `/api/chat` route exists
4. Test API key at [Google AI Studio](https://makersuite.google.com/app/apikey)

### Wrong Information in Responses
1. Update `SYSTEM_CONTEXT` in `/api/chat/route.ts`
2. Redeploy/restart server
3. Clear chat and ask again

### "Failed to get response"
1. Check internet connection
2. Verify API key is correct
3. Check Gemini API status
4. Look at server logs for detailed error

### API Quota Exceeded
1. Check usage at Google AI Studio
2. Upgrade to paid tier if needed
3. Add rate limiting to API route

---

## 🚀 Deployment

### Environment Variables

Make sure to set in production:
```bash
GEMINI_API_KEY=your_production_api_key
```

### Vercel Deployment

1. Go to Vercel Dashboard
2. Select your project
3. Settings → Environment Variables
4. Add `GEMINI_API_KEY`
5. Redeploy

---

## 📊 Monitoring

### Track Usage

Add logging in `/api/chat/route.ts`:
```typescript
console.log(`Chat request from user: ${message.slice(0, 50)}...`);
```

### Analytics Ideas

Track in your database:
- Number of conversations
- Common questions
- Response times
- User satisfaction

---

## 🎯 Future Enhancements

Ideas for improvement:
1. **Voice Input**: Add speech-to-text
2. **Multi-language**: Support Tamil, Hindi, etc.
3. **Image Understanding**: Upload photos of documents
4. **Booking Integration**: Direct booking from chat
5. **Personalization**: Remember user preferences
6. **Admin Dashboard**: View chat analytics
7. **Feedback System**: Rate responses

---

## ✨ Summary

Your AI chatbot is now:
- ✅ **Live** on all pages
- ✅ **Focused** on Sabarimala topics only
- ✅ **Helpful** with detailed information
- ✅ **Beautiful** modern UI
- ✅ **Fast** edge runtime
- ✅ **Affordable** Gemini pricing
- ✅ **Secure** API key protected

Just add your Gemini API key and start chatting! 🙏

**Swamiye Saranam Ayyappa! 🕉️**

