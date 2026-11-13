import { Blockquote } from '@n3wth/ui/primitives'
import { Beat } from '../kit/Beat'
import { ToggleCompare } from '../kit/ToggleCompare'

/* Grounded in gbrain concepts/llm-inference. The note gives structure, not
   a stopwatch: prefill runs once in parallel, decode runs sequentially and
   is bottlenecked by memory bandwidth (reloading weights + KV cache every
   step), not FLOPs. No millisecond figures exist in the source, so the
   first toggle specimen is built from that structure rather than invented
   timings — it contrasts the common assumption (inference is a compute
   problem) against the actual constraint (it's a memory problem). The real
   numbers that do exist in the source — 16GB unified memory on the Mac
   mini, the planned 48GB upgrade, 16-bit weights quantized to 4-bit — carry
   the second toggle instead. The source frames the 48GB upgrade as capacity
   for larger, more complex local models, not as a precision or speed win —
   kept that framing exact rather than inferring "full precision." */

function ComputeVsMemorySpecimen({ memoryBound }: { memoryBound: boolean }) {
  return (
    <svg viewBox="0 0 340 170" className="h-44 w-full max-w-sm" role="presentation" focusable="false">
      <rect x={30} y={20} width={70} height={50} fill="none" stroke="var(--ink)" strokeWidth={1.5} />
      <text x={65} y={48} textAnchor="middle" fontSize={11} fill="var(--ink-dim)">
        processor
      </text>
      <rect x={240} y={20} width={70} height={50} fill="none" stroke="var(--ink)" strokeWidth={1.5} />
      <text x={275} y={44} textAnchor="middle" fontSize={11} fill="var(--ink-dim)">
        weights +
      </text>
      <text x={275} y={58} textAnchor="middle" fontSize={11} fill="var(--ink-dim)">
        KV cache
      </text>
      {memoryBound ? (
        <>
          {[0, 1, 2, 3].map((i) => (
            <line
              key={i}
              x1={100}
              y1={45}
              x2={240}
              y2={45}
              stroke="var(--rail-strong)"
              strokeWidth={1.5}
              transform={`translate(0 ${i * 22})`}
              opacity={1 - i * 0.15}
            />
          ))}
          <text x={170} y={150} textAnchor="middle" fontSize={12} fill="var(--ink)">
            one round trip per output token
          </text>
        </>
      ) : (
        <>
          <line x1={100} y1={45} x2={240} y2={45} stroke="var(--ink-faint)" strokeWidth={1.5} />
          <text x={170} y={150} textAnchor="middle" fontSize={12} fill="var(--ink-faint)">
            assumed: one big sum, once
          </text>
        </>
      )}
    </svg>
  )
}

function MemoryCapacitySpecimen({ upgraded }: { upgraded: boolean }) {
  const width = upgraded ? 288 : 96
  return (
    <svg viewBox="0 0 340 120" className="h-32 w-full max-w-sm" role="presentation" focusable="false">
      <text x={10} y={20} fontSize={11} fill="var(--ink-faint)">
        unified memory
      </text>
      <rect x={10} y={30} width={320} height={28} fill="none" stroke="var(--rail)" strokeWidth={1} />
      <rect x={10} y={30} width={width} height={28} fill="var(--ink)" />
      <text x={20} y={49} fontSize={12} fill={upgraded ? 'var(--ink-faint)' : 'var(--accent-ink)'}>
        {upgraded ? '48GB' : '16GB'}
      </text>
      <text x={10} y={85} fontSize={12} fill="var(--ink-dim)">
        {upgraded
          ? 'room to run larger, more complex models locally'
          : 'forces aggressive 4-bit quantization to fit at all'}
      </text>
    </svg>
  )
}

export default function LlmInference() {
  return (
    <div>
      <Beat
        prose={
          <>
            An inference request has two phases that behave nothing alike. The prompt gets
            processed all at once, every token attending to every other token in parallel. That's
            prefill, and it happens exactly once per request. Then the model has to produce the
            reply, and that part is sequential: one token out, fed back in as input, one token out
            again. There's no parallelizing your way around it. Token 200 cannot start until token
            199 exists.
          </>
        }
      />

      <Beat
        prose={
          <>
            The instinct is to think of both phases as a compute problem — more FLOPs, faster
            answer — because that's how training works. Decode doesn't work that way. Every single
            step has to reload the model's weights and the running history of prior activations,
            the KV cache, out of memory and onto the processor before it can produce one token.
            The arithmetic itself is cheap. The trip to memory, repeated once per output token, is
            what the clock is actually measuring.
          </>
        }
      >
        <ToggleCompare
          beforeLabel="assumed"
          afterLabel="actual"
          before={<ComputeVsMemorySpecimen memoryBound={false} />}
          after={<ComputeVsMemorySpecimen memoryBound />}
          caption="decode is memory-bandwidth-bound, not FLOPs-bound — the bottleneck is the round trip, not the sum."
        />
      </Beat>

      <Beat
        prose={
          <>
            This is not abstract on the hardware I actually run. My agent setup lives on a Mac
            mini M4 with 16GB of unified memory, which is memory-constrained enough that it
            dictates the whole design. Weights get compressed from 16-bit floats down to 4-bit
            representations, and a router sends short, simple prompts to the small quantized model
            to keep tokens-per-second high and memory pressure low. The upgrade I've got planned —
            an M4 Pro with 48GB — is aimed straight at that ceiling: room to run larger, more
            complex models locally instead of routing everything through the smallest thing that
            fits.
          </>
        }
      >
        <ToggleCompare
          beforeLabel="current"
          afterLabel="planned"
          before={<MemoryCapacitySpecimen upgraded={false} />}
          after={<MemoryCapacitySpecimen upgraded />}
          caption="16GB unified memory forces aggressive quantization; 48GB buys room for bigger models, not raw speed."
        />
      </Beat>

      <Beat
        prose={
          <>
            The same constraint shows up at enterprise scale, just wearing different clothes. On
            the team I work with at Google Cloud, integrating the most capable available models
            into products means the memory-bandwidth problem becomes a fleet problem: high-
            concurrency middleware, prompt engineering that trims what has to be reloaded per
            request, and token management systems, all aimed at the same two numbers a Mac mini
            router is also optimizing for — time-to-first-token and tokens-per-second — except now
            the third variable is cost, multiplied across every concurrent request.
          </>
        }
      />

      <Blockquote className="mt-4 max-w-[48ch]">
        Prefill is a sum you pay once. Decode is a toll you pay per token — and the toll booth is
        memory, not math.
      </Blockquote>
    </div>
  )
}
