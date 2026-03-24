# AI Provider Configuration Guide

This document explains how to set up and use different AI providers (Gemini, Grok, Claude) for question generation in FeedMind.

## Setup Steps

### 1. Environment Variables

Your API keys have been added to `.env.local`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GROK_API_KEY=your_grok_api_key_here
CLAUDE_API_KEY=your_claude_api_key_here
```

⚠️ **IMPORTANT**: This file is local and should NEVER be committed to version control.

### 2. Database Schema Update

The User model now includes two new fields:
- `aiProvider` (String): Which AI provider to use (default: "gemini")
- `aiProviderEnabled` (Boolean): Whether AI features are enabled (default: true)

**Run the migration:**
```bash
cd frontend
npx prisma migrate dev --name add_ai_provider
```

### 3. Profile Settings UI

Users can now configure their AI provider in the profile settings:
- **Path**: `/dashboard/profile`
- **New Section**: "AI Model Selection"

Features:
✅ Select between Gemini, Grok, and Claude
✅ Enable/Disable AI features with a toggle switch
✅ Real-time settings persistence

## AI Provider Recommendations

### 🔵 Google Gemini (Recommended)
- **Best for**: Question generation, general-purpose AI tasks
- **Speed**: Very fast
- **Cost**: Affordable with generous free tier
- **Quality**: Excellent quality output
- **Recommended**: YES - Use as default

### 🟣 Xai Grok  
- **Best for**: Real-time information, complex reasoning
- **Speed**: Fast
- **Cost**: Moderate
- **Quality**: High quality, good for nuanced questions
- **Recommended**: For specific use cases requiring real-time info

### 🟠 Anthropic Claude
- **Best for**: Long-form content, detailed analysis
- **Speed**: Slightly slower than Gemini
- **Cost**: Moderate to high
- **Quality**: Excellent, very detailed responses
- **Recommended**: For premium quality results

## Usage in Code

### Get the Current Provider Configuration

```typescript
import { getAIProviderConfig } from "@/lib/ai-provider";

// In your API route or server action
const user = await prisma.user.findUnique({
  where: { email: session.user.email }
});

const config = getAIProviderConfig(user.aiProvider);
// config will have: { provider, apiKey, model, baseUrl }
```

### Implement Provider-Specific Calls

**For Gemini:**
```typescript
const response = await fetch(
  'https://generativelanguage.googleapis.com/v1/generateContent',
  {
    method: 'POST',
    headers: {
      'x-goog-api-key': config.apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  }
);
```

**For Grok:**
```typescript
const response = await fetch(
  'https://api.xai.com/v1/chat/completions',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'grok-3',
      messages: [{ role: 'user', content: prompt }],
    }),
  }
);
```

**For Claude:**
```typescript
const response = await fetch(
  'https://api.anthropic.com/v1/messages',
  {
    method: 'POST',
    headers: {
      'x-api-key': config.apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-1',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  }
);
```

## Security Considerations

1. **Never expose API keys to the frontend** - All API calls must happen on the backend
2. **Validate user's aiProviderEnabled flag** - Check before making API calls
3. **Rate limiting** - Implement rate limiting per user/provider
4. **Error handling** - Gracefully fallback to Gemini if a provider fails
5. **Monitoring** - Log API usage per provider for cost tracking

## Troubleshooting

### API Key Not Working
- Verify the key in `.env.local`
- Check that the format is correct for each provider
- Ensure the key has proper permissions

### Provider Selection Not Saving
- Check the database for the user records
- Verify the `/api/user/ai-provider` endpoint is working
- Check browser console for error messages

### Question Generation Failing
- Verify the API key has correct permissions
- Check the provider's API documentation
- Implement proper error handling and fallback logic

## File Locations

- **Environment Variables**: `frontend/.env.local`
- **AI Provider Utility**: `frontend/lib/ai-provider.ts`
- **Profile Settings Component**: `frontend/components/profile/ai-provider-settings.tsx`
- **Settings Page**: `frontend/app/(dashboard)/profile/page.tsx`
- **API Endpoint**: `frontend/app/api/user/ai-provider/route.ts`
- **Database Schema**: `frontend/lib/prisma/schema.prisma`

## Next Steps

1. Run the database migration to add the new fields
2. Test the profile settings UI
3. Update the question generation logic to use the selected provider
4. Monitor API usage across different providers
5. Consider implementing provider failover logic
