# 🤖 AI Chatbot - Quick Start

## ⚡ 3-Step Setup

### 1️⃣ Get Gemini API Key
Go to: https://makersuite.google.com/app/apikey
- Sign in with Google
- Click "Create API Key"
- Copy the key (starts with `AIza...`)

### 2️⃣ Add to .env.local
```bash
GEMINI_API_KEY=AIzaSy...your_key_here
```

### 3️⃣ Restart Server
```bash
npm run dev
```

## ✅ Done!

Look for the **"Ask AI Assistant"** button in bottom-right corner!

---

## 🎯 What the Chatbot Does

**ONLY responds to:**
- Sabarimala Yatra information
- Annadanam booking help
- Pooja booking help
- Darshan booking help
- Samithi information

**Will NOT respond to:** Politics, weather, jokes, or anything unrelated!

---

## 🧪 Test It

Try asking:
- "How do I book Annadanam?"
- "Tell me about Sabarimala Yatra"
- "What is the dress code?"
- "How to book Pooja?"

---

## 📍 Files Created

1. **API Route**: `src/app/api/chat/route.ts`
2. **Component**: `src/components/chat/AIChatbot.tsx`
3. **Provider**: `src/components/Providers.tsx` (updated)

The chatbot appears on ALL pages automatically! 🎉

---

## 💰 Cost

**Very affordable!** 
- Gemini 1.5 Flash is super cheap
- Free tier available for testing
- ~$15-30/month for 1000 chats/day

---

## 📚 Full Documentation

See `AI_CHATBOT_SETUP.md` for complete details!

**Swamiye Saranam Ayyappa! 🙏**

