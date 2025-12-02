# GhawdeX Unified Telegram Notifications

3-tier notification system for all GhawdeX projects.

## Tiers

| Tier | Audience | Purpose |
|------|----------|---------|
| **admin** | CEO/CTO | Critical business events only |
| **everything** | Developers | Complete audit log (every event) |
| **team** | Operations | Actionable items, client progress |

## Setup

### 1. Create Telegram Bots

Via [@BotFather](https://t.me/BotFather):
1. Create bot, get token
2. Create group chat
3. Add bot to group
4. Get chat ID (send message, check `https://api.telegram.org/bot<TOKEN>/getUpdates`)

### 2. Environment Variables

```env
TELEGRAM_BOT_TOKEN=your-bot-token

TELEGRAM_ADMIN_CHAT_ID=-1001234567890
TELEGRAM_EVERYTHING_CHAT_ID=-1001234567891
TELEGRAM_TEAM_CHAT_ID=-1001234567892
```

### 3. Copy to Project

```bash
cp -r packages/telegram/ your-project/lib/telegram/
```

## Usage

```typescript
import {
  notify,
  notifyNewLead,
  notifyContractSigned,
  notifyError
} from '@/lib/telegram';

// Send to specific tier(s)
await notify('admin', 'Critical message');
await notify(['everything', 'team'], 'Team update');

// Use convenience functions (auto-routes)
await notifyNewLead({
  customerName: 'John Doe',
  phone: '+356 9999 9999',
  source: 'landings'
});

await notifyContractSigned({
  customerName: 'John Doe',
  contractRef: 'GHX-CON-001',
  totalPrice: 12000,
  source: 'backoffice'
});

await notifyError({
  error: 'Failed to process bill',
  context: 'Bill Analysis',
  source: 'backoffice'
});
```

## Event Routing

| Event | Everything | Team | Admin |
|-------|:----------:|:----:|:-----:|
| Page view | ✅ | | |
| Click tracking | ✅ | | |
| Phone/WhatsApp click | ✅ | ✅ | |
| New lead | ✅ | ✅ | |
| Bill received | ✅ | ✅ | |
| Contract signed | ✅ | ✅ | ✅ |
| Payment received | ✅ | ✅ | ✅ |
| Error | ✅ | | ✅ |
| Daily summary | | | ✅ |

## Files

- `index.ts` - Main exports
- `types.ts` - TypeScript types, event routing map
- `client.ts` - Low-level Telegram API
- `router.ts` - 3-tier routing logic
- `formatters.ts` - Message templates, keyboard builders
