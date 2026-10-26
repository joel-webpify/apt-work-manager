import { Facebook, Instagram, MoreHorizontal, ThumbsUp, MessageCircle, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type MockAd, type Client } from '@/lib/metaAdsMock';
import garden from '@/assets/products/artificial-grass.jpg';
import clean from '@/assets/products/window-clean.jpg';
import heat from '@/assets/products/plumbing.jpg';
export const mediaAssets: Record<string, string> = { garden, clean, heat };
export function MockPreview({ ad, client, placement = 'Facebook feed' }: { ad: MockAd; client: Client; placement?: string }) {
 const vertical = /Stories|Reels/.test(placement);
 return <div className={`border rounded-md bg-card overflow-hidden mx-auto w-full ${vertical ? 'max-w-[250px]' : 'max-w-[330px]'}`}>
  <div className="p-3 flex items-center gap-2"><span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">{placement.startsWith('Instagram') ? <Instagram size={16} /> : <Facebook size={16} />}</span><div className="min-w-0 flex-1"><p className="text-xs font-medium truncate">{client.page}</p><p className="text-[10px] text-muted-foreground">Sponsored · ◉</p></div><MoreHorizontal size={16} /></div>
  {!vertical && <p className="px-3 pb-3 text-xs whitespace-pre-wrap">{ad.text}</p>}
  <div className={`relative ${vertical ? 'aspect-[9/16]' : 'aspect-square'} bg-muted`}><img src={mediaAssets[ad.media] ?? mediaAssets[client.id]} alt={`${client.industry} service`} className="w-full h-full object-cover" />{vertical && <div className="absolute inset-x-0 bottom-0 p-4 bg-background/90"><p className="text-sm font-medium">{ad.headline}</p><p className="text-xs mt-1 line-clamp-3">{ad.text}</p></div>}</div>
  <div className="p-3 bg-surface flex gap-2 items-center"><div className="flex-1 min-w-0"><p className="text-[10px] uppercase text-muted-foreground">{ad.url ? ad.url.replace(/^https?:\/\//, '').split('/')[0] : client.page}</p><p className="font-medium text-sm break-words">{ad.headline}</p></div><Button variant="outline" size="sm" onClick={() => import('sonner').then(({ toast }) => toast.info('Demo ad destination'))}>{ad.cta.replace(/_/g, ' ').toLowerCase()}</Button></div>
  {!vertical && <div className="flex justify-around border-t p-2 text-xs text-muted-foreground"><span className="flex gap-1"><ThumbsUp size={13} /> Like</span><span className="flex gap-1"><MessageCircle size={13} /> Comment</span><span className="flex gap-1"><Share2 size={13} /> Share</span></div>}
 </div>;
}
