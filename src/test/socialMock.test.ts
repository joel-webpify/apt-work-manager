import { describe, it, expect } from 'vitest';
import { socialClients, newSocialPost, seedSocialPosts, seedSocialMedia, seedSocialConversations, defaultSocialSettings, validateSocialPost, dmWindow, scheduledStatus } from '../lib/socialMock';
describe('Social mockup rules', () => {
 it('provides 60 demo posts', () => expect(seedSocialPosts()).toHaveLength(60));
 it('provides 40 images', () => expect(seedSocialMedia().filter(m => m.type === 'Image')).toHaveLength(40));
 it('provides 8 videos', () => expect(seedSocialMedia().filter(m => m.type === 'Video')).toHaveLength(8));
 it('provides 40 comments', () => expect(seedSocialConversations().filter(c => c.kind === 'Comment')).toHaveLength(40));
 it('provides 15 message conversations', () => expect(seedSocialConversations().filter(c => c.kind === 'Message')).toHaveLength(15));
 it('rejects Instagram text-only posts', () => { const p = newSocialPost(socialClients[0]); p.type = 'Text only'; p.caption = 'Hello'; expect(validateSocialPost(p, defaultSocialSettings().garden)).toContain("Instagram doesn't support text-only or link posts."); });
 it('limits Instagram captions to 2200 characters', () => { const p = newSocialPost(socialClients[0]); p.caption = 'a'.repeat(2201); expect(validateSocialPost(p, defaultSocialSettings().garden)).toContain('Instagram captions cannot exceed 2,200 characters.'); });
 it('limits Instagram hashtags to 30', () => { const p = newSocialPost(socialClients[0]); p.caption = Array.from({ length: 31 }, (_, i) => '#tag' + i).join(' '); expect(validateSocialPost(p, defaultSocialSettings().garden)).toContain('Instagram allows at most 30 hashtags.'); });
 it('requires 2–10 carousel items', () => { const p = newSocialPost(socialClients[0]); p.caption = 'Hello'; p.type = 'Carousel'; p.media = ['one']; expect(validateSocialPost(p, defaultSocialSettings().garden)).toContain('Carousels need 2–10 items.'); });
 it('requires approval before scheduling when enabled', () => expect(scheduledStatus(true)).toBe('Needs approval'));
 it('opens ordinary DM replies for 24 hours', () => expect(dmWindow('2026-10-26T00:00:00Z', Date.parse('2026-10-27T00:00:00Z'))).toBe('Open'));
 it('allows only human-agent follow-up beyond 24h within seven days', () => expect(dmWindow('2026-10-20T00:00:00Z', Date.parse('2026-10-26T00:00:00Z'))).toBe('Human agent'));
 it('closes DM replies beyond seven days', () => expect(dmWindow('2026-10-18T00:00:00Z', Date.parse('2026-10-26T00:00:00Z'))).toBe('Closed'));
});