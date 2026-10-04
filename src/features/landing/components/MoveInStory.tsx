import { CalendarCheck, MapPin } from "lucide-react";
import { Stamp } from "@/components/paper/Stamp";
import { PaperMiniScene } from "@/components/paper/PaperScene";
import { ChatMessageBubble, type ChatMessageData } from "@/features/chat/components/ChatMessageBubble";

const MESSAGES: ChatMessageData[] = [
  { id: "1", sender: "them", senderName: "Riya", text: "Hi! Is the room still free from June?", timestamp: "10:02" },
  { id: "2", sender: "me", text: "It is. Want to see it on Saturday?", timestamp: "10:05", status: "read" },
  { id: "3", sender: "them", senderName: "Riya", text: "Saturday at 11 works for me.", timestamp: "10:06" }
];

const FACTS = [
  { title: "Checked before it is live", body: "Every room is reviewed first: real photos, real rent, real dates." },
  { title: "Every chat knows the room", body: "The listing and your score come with the first message. No cold hellos." },
  { title: "A visit in two taps", body: "Pick a slot in the chat. It lands in Visits for both of you." }
];

/**
 * From match to move-in, told with the app's own parts: the chat about a
 * room, the visit pass it produced and the verified stamp on the listing.
 */
export function MoveInStory() {
  return (
    <section aria-labelledby="movein-heading" className="page-container grid gap-14 py-[72px] md:py-24 lg:grid-cols-12 lg:items-center lg:gap-10">
      <div className="lg:col-span-4">
        <h2 id="movein-heading" className="text-display max-w-[14ch] text-ink">
          From match to move-in.
        </h2>
        <div className="mt-8 flex flex-col gap-6">
          {FACTS.map((fact) => (
            <div key={fact.title}>
              <h3 className="text-h3 text-ink">{fact.title}</h3>
              <p className="mt-1.5 max-w-[40ch] text-body-lg text-ink-2">{fact.body}</p>
            </div>
          ))}
        </div>
      </div>

      <figure className="relative mx-auto w-full max-w-[620px] lg:col-span-8 lg:max-w-none">
        <figcaption className="sr-only">
          Example: a chat about a shared 2BHK in HSR Layout for 18,000 rupees a month, ending in a visit booked for Saturday at 11.
        </figcaption>
        <div inert className="relative grid gap-6 sm:block sm:min-h-[460px]">
          {/* Layer 1: the chat sheet. */}
          <div className="paper-grain relative rounded-hand bg-surface p-4 shadow-sm sm:ml-[14%] sm:mr-[18%] sm:-rotate-[0.8deg] sm:p-5">
            <div className="flex items-center gap-3 rounded-cut-md bg-paper-1 p-2.5">
              <PaperMiniScene prop="house" className="w-16 shrink-0 rounded-cut-sm" />
              <div className="min-w-0">
                <p className="truncate text-label-lg text-ink">2BHK share, HSR Layout</p>
                <p className="text-body-md tabular-nums text-ink-2">₹18,000 a month, 91% match</p>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              {MESSAGES.map((message) => (
                <ChatMessageBubble key={message.id} message={message} />
              ))}
            </div>
          </div>

          {/* Layer 2: the visit pass it produced, a ticket with a tear-off stub. */}
          <div className="relative sm:absolute sm:bottom-2 sm:right-0 sm:w-[62%] sm:rotate-[1.6deg]">
            <div className="[filter:drop-shadow(2px_6px_6px_rgb(35_32_28/0.18))]">
              <div className="paper-edge-ticket paper-grain flex rounded-cut-lg bg-paper-3 [--stub:74%]">
                <div className="min-w-0 flex-[74] p-5 pr-6">
                  <p className="flex items-center gap-2 text-label-md text-pine">
                    <CalendarCheck aria-hidden="true" className="h-4 w-4" /> Visit confirmed
                  </p>
                  <p className="mt-2 text-h2 text-ink">Sat 14 June, 11:00</p>
                  <p className="mt-1 flex items-center gap-1.5 text-body-md text-ink-2">
                    <MapPin aria-hidden="true" className="h-4 w-4 shrink-0" /> 27th Main, HSR Layout
                  </p>
                </div>
                <div className="grid flex-[26] place-items-center rounded-r-cut-lg bg-paper-1 px-2 text-center">
                  <p className="text-caption text-ink-3">
                    Pass
                    <span className="mt-0.5 block text-label-lg tabular-nums text-ink">A-2041</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Layer 3: the stamp pressed across the chat's corner. */}
          <Stamp className="absolute -right-2 -top-12 size-20 -rotate-12 sm:-top-10 sm:right-[10%] sm:size-28" />
        </div>
      </figure>
    </section>
  );
}
