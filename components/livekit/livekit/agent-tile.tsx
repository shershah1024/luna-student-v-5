import { type AgentState, BarVisualizer, type TrackReference } from '@livekit/components-react';
import { cn } from '@/lib/utils';

interface AgentAudioTileProps {
  state: AgentState;
  audioTrack: TrackReference;
  className?: string;
}

export const AgentTile = ({
  state,
  audioTrack,
  className,
  ref,
}: React.ComponentProps<'div'> & AgentAudioTileProps) => {
  return (
    <div ref={ref} className={cn(className)}>
      <BarVisualizer
        barCount={5}
        state={state}
        options={{ minHeight: 5 }}
        trackRef={audioTrack}
        className={cn('flex aspect-video w-40 items-center justify-center gap-1')}
      >
        <span
          className={cn([
            'bg-gray-400 min-h-4 w-4 rounded-full',
            'origin-center transition-colors duration-250 ease-linear',
            'data-[lk-highlighted=true]:bg-gray-800 data-[lk-muted=true]:bg-gray-300',
          ])}
        />
      </BarVisualizer>
    </div>
  );
};
