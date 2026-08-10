import { useState } from 'react';
import { ChevronLeft, ChevronDown, Camera, Check } from 'lucide-react';
import { Button, Sheet, Input, cn } from '@mockups/ui';
import { COMMENT_CATEGORIES, type CommentCategory } from '../../data/salesperson';

/* Salesperson · Create Interaction — log a shop visit: category + comments +
   an optional shop photo. Submit returns to Task Details (mock — no upload). */
export function CreateInteractionScreen({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const [category, setCategory] = useState<CommentCategory | null>(null);
  const [comments, setComments] = useState('');
  const [photo, setPhoto] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const valid = category && comments.trim();

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 shadow-sm">
        <button
          onClick={onBack}
          aria-label="Back"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-foreground active:scale-[0.98]"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold leading-tight">Interaction form</h1>
      </header>

      <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto bg-background-subtle p-4">
        {/* category */}
        <div className="space-y-1.5">
          <span className="block text-sm font-medium text-foreground">Comment category</span>
          <button
            onClick={() => setPickerOpen(true)}
            className="flex h-10 w-full items-center justify-between rounded-md border border-border bg-card px-3 text-left text-sm active:scale-[0.99]"
          >
            <span className={category ? 'text-foreground' : 'text-foreground-secondary'}>
              {category ?? 'Select a category'}
            </span>
            <ChevronDown className="h-4 w-4 text-foreground-secondary" />
          </button>
        </div>

        {/* comments */}
        <div className="space-y-1.5">
          <label htmlFor="int-comments" className="text-sm font-medium text-foreground">Comments</label>
          <Input
            id="int-comments"
            placeholder="Enter comments here"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
          />
        </div>

        {/* photo */}
        <div className="space-y-1.5">
          <span className="block text-sm font-medium text-foreground">Shop photo</span>
          <button
            onClick={() => setPhoto(true)}
            className={cn(
              'flex h-24 w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed text-xs font-medium active:scale-[0.99]',
              photo ? 'border-primary bg-primary-soft text-primary' : 'border-border bg-card text-foreground-secondary'
            )}
          >
            {photo ? <Check className="h-6 w-6" /> : <Camera className="h-6 w-6" />}
            {photo ? 'Photo captured' : 'Take shop photo (optional)'}
          </button>
        </div>
      </div>

      <div className="border-t border-border bg-card p-3">
        <Button fullWidth disabled={!valid} onClick={onDone}>
          Submit
        </Button>
      </div>

      <Sheet open={pickerOpen} onClose={() => setPickerOpen(false)} title="Comment category">
        <div className="space-y-1">
          {COMMENT_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => {
                setCategory(c);
                setPickerOpen(false);
              }}
              className={cn(
                'flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm active:scale-[0.99]',
                category === c ? 'bg-primary-soft font-medium text-primary' : 'text-foreground hover:bg-muted'
              )}
            >
              {c}
              {category === c && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}
