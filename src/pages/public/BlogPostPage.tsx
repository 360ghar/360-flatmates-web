import { useParams, Link } from "react-router";
import { SeoHelmet, SITE_URL, buildArticleSchema, buildHowToSchema, buildSpeakableSchema } from "@/lib/seo";
import { NetworkImage } from "@/components/ui/NetworkImage";
import { BlogPostPage as DynamicBlogPostPage } from "@/pages/app/BlogPostPage";

/**
 * Public-facing blog post route. The new system serves posts via the
 * `BlogPostPage` from `app/` backed by `/blog/posts/{id}`. This shim
 * delegates to that page for fresh slugs, and falls back to the legacy
 * hardcoded dictionary (the `BLOG_CONTENT` map below) for older posts
 * that have not yet been migrated to the backend.
 */
export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return null;
  // The legacy map covers a finite, pre-migration set of slugs. Anything
  // else routes through the dynamic page which fetches from the backend.
  if (BLOG_CONTENT[slug]) {
    return <LegacyBlogPostPage />;
  }
  return <DynamicBlogPostPage />;
}

const BLOG_CONTENT: Record<string, { title: string; excerpt: string; date: string; publishDate: string; readTime: string; category: string; image: string; content: string }> = {
  "how-to-find-compatible-flatmates": {
    title: "How to Find Compatible Flatmates: A Complete Guide",
    excerpt: "Learn the 6 key dimensions that determine flatmate compatibility and how to evaluate potential matches before moving in.",
    date: "May 2025",
    publishDate: "2025-05-19",
    readTime: "8 min read",
    category: "Guide",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&auto=format&fit=crop&q=80",
    content: `
Finding the right flatmate is one of the most important decisions you'll make when moving to a new city. A compatible flatmate can make your living experience enjoyable, while an incompatible one can turn your home into a source of daily stress.

## The 6 Dimensions of Flatmate Compatibility

Our research with thousands of successful flatmate pairings has identified six key dimensions that determine compatibility:

### 1. Sleep Schedule
Early risers and night owls can coexist, but only if both parties understand and respect each other's schedules. The key questions: What time do you typically go to bed? What time do you wake up? Are you a light or heavy sleeper?

### 2. Cleanliness Standards
This is the #1 source of flatmate conflict. Some people need a spotless kitchen after every meal, while others are comfortable with dishes sitting overnight. Neither approach is wrong, but mismatched expectations cause problems.

### 3. Food Habits
Vegetarian and non-vegetarian flatmates can absolutely live together, but it requires clear communication about shared kitchen use, storage, and cooking schedules.

### 4. Guest Policy
How often do you have friends over? Do you host overnight guests? What about significant others? These are crucial conversations to have before moving in.

### 5. Work Style
Working from home has changed the flatmate dynamic. If both of you work from home, you need to discuss noise levels, meeting schedules, and shared workspace usage.

### 6. Lifestyle Preferences
Social vs. introverted, party weekends vs. quiet nights, AC temperature preferences: these daily habits add up to determine your overall living experience.

## How to Evaluate Potential Flatmates

1. **Use a structured questionnaire**: Don't rely on vibes alone. Ask specific questions about each dimension.
2. **Schedule a visit**: Meet in person at the property to see the actual living conditions.
3. **Check references**: If possible, talk to their previous flatmates.
4. **Start with a trial period**: A month-to-month arrangement lets you test compatibility before committing long-term.

## Red Flags to Watch For

- Unwillingness to discuss expectations upfront
- Vague answers about cleanliness or guest policies
- Pushing you to decide immediately without a visit
- Inconsistent information about the property

## The 360 Flatmates Advantage

Our platform addresses these challenges with:
- **6-dimension compatibility scoring** based on your actual preferences
- **Verified listings** so you know the property is real
- **In-app chat** to start conversations with context
- **Visit scheduling** to coordinate property tours easily

Finding the right flatmate takes effort, but getting it right is worth it. Start by understanding your own preferences, then use those as a filter when evaluating potential matches.
    `,
  },
  "flatmate-agreement-essentials": {
    title: "The Essential Flatmate Agreement Checklist",
    excerpt: "Everything you need to cover in a flatmate agreement, from rent splitting to guest policies to cleaning schedules.",
    date: "April 2025",
    publishDate: "2025-04-15",
    readTime: "6 min read",
    category: "Guide",
    image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&auto=format&fit=crop&q=80",
    content: `
Moving in with a flatmate is an exciting step, but it also introduces shared financial and personal responsibilities. To prevent future misunderstandings, a structured flatmate agreement is highly recommended. Below is the ultimate checklist of essentials to include in your agreement.

## Rent and Financial Responsibilities

Financial clarity is the cornerstone of any successful roommate relationship.
- **Rent Breakdown**: Specify the exact share of rent each flatmate is responsible for and who is on the main lease.
- **Due Date and Payment Method**: Agree on the date rent is due and the transfer method (e.g. direct bank transfer to the landlord or split payments).
- **Security Deposit Split**: Record how the security deposit was split and the process for return upon lease termination.

## Utility Bills and Shared Expenses

Utility splits should be codified to avoid passive-aggressive bill disputes.
- **Broadband & WiFi**: How is the internet bill divided and who owns the subscription account?
- **Electricity & Power Backup**: Establish how electricity and diesel backup fees are calculated and shared.
- **Housekeeping & Cooking staff**: If you employ shared domestic help (cooks, cleaners), specify their monthly salaries and payment schedules.

## Household Chores and Cleaning Schedules

Cleanliness differences are the most common source of roommate friction.
- **Common Area Cleaning**: Define daily, weekly, and monthly chores for shared spaces like the kitchen, living room, and balconies.
- **Individual Responsibilities**: Confirm that personal bedrooms and bathrooms are the responsibility of the individual occupant.
- **Waste Management**: Agree on a schedule for segregating waste (dry, wet, sanitary) and disposing of it.

## Quiet Hours and Work Styles

With work-from-home becoming standard, noise rules are vital.
- **Quiet Hours**: Define specific times (e.g., 10:00 PM to 7:00 AM) where noise levels should be kept to a minimum.
- **WFH Protocol**: Respect each other's work calls by reserving common desk areas and coordinating meeting schedules.

## Guest Policy and Social Vibe

Set boundaries on who can visit and when.
- **Day Guests**: Outline guidelines for having friends or colleagues over. Do you need to notify other flatmates in advance?
- **Overnight Guests**: Agree on limits for overnight stays (e.g., maximum of 2 nights consecutive per week) and clarify expectations around significant others.
    `,
  },
  "bangalore-rental-market-guide": {
    title: "Bangalore Rental Market Guide 2025",
    excerpt: "Average rents, best neighborhoods, and what to look for when renting in India's tech capital.",
    date: "March 2025",
    publishDate: "2025-03-20",
    readTime: "10 min read",
    category: "Market Insights",
    image: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=1200&auto=format&fit=crop&q=80",
    content: `
Navigating the rental market in Bangalore, India's Silicon Valley, requires local knowledge. With massive influxes of tech talent, rents fluctuate significantly between neighborhoods. Here is your comprehensive guide to renting in Bangalore in 2025.

## Top Neighborhoods for Professionals

Where you live should balance office proximity with social vibe.
- **Koramangala**: The startup hub. Known for its tree-lined streets, cafe culture, and high density of young professionals.
- **Indiranagar**: A premium commercial and residential hub. Great nightlife, shopping, and metro connectivity.
- **HSR Layout**: The fastest-growing tech residential sector, offering modern gated societies and builder floors.
- **Whitefield & Electronic City**: Perfect for employees working in major IT tech parks, offering lower rental rates but longer commutes to the central city.

## Average Rental Rates (2025 Estimates)

Rents vary based on whether you choose a builder floor or a gated society.
- **1 BHK**: ₹15,000 to ₹25,000 per month (suburbs vs prime localities).
- **2 BHK**: ₹28,000 to ₹45,000 per month.
- **3 BHK**: ₹45,000 to ₹75,000+ per month in premium gated societies.

## Essential Things to Inspect

Bangalore has unique market factors that you must verify before signing a lease.
- **Water Supply Source**: Check if the building has Cauvery water connection, borewell water, or relies on private water tankers. Tanker supply can increase maintenance bills.
- **Security Deposit**: Traditionally, Bangalore landlords ask for 5 to 10 months of rent as a deposit. However, platforms like 360 Flatmates help negotiate deposits down to 2-3 months.
- **Society Maintenance Charges**: Ensure you clarify if the maintenance fee is included in the quoted rent or listed as a separate monthly charge.
    `,
  },
  "moving-in-with-strangers": {
    title: "Moving in with Strangers: Tips from Real Flatmates",
    excerpt: "Real stories and practical advice from people who successfully found flatmates through 360 Flatmates.",
    date: "February 2025",
    publishDate: "2025-02-18",
    readTime: "5 min read",
    category: "Community",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&auto=format&fit=crop&q=80",
    content: `
Moving in with someone you don't know can feel intimidating. However, thousands of professionals successfully co-live with strangers every year, often forming lifelong friendships. Here are the top tips shared by real flatmates who met on 360 Flatmates.

## Establish Rules on Day One

Proactive communication is better than reactive conflict.
- **Set boundaries early**: Talk about kitchen usage, cleaning preferences, and guest policies during your first week.
- **Define shared items**: Agree on what is shared (e.g. cooking oil, salt, cleaning supplies) versus what is strictly personal.

## Respect Introverted Needs and Quiet Space

Co-living doesn't mean you have to be social 24/7.
- **Respect closed doors**: A closed bedroom door is a signal for privacy. Ensure everyone has space to recharge.
- **Create quiet zones**: Keep common areas like living rooms free from excessive noise during working hours.

## Schedule Regular Check-ins

Minor annoyances can compile if left unaddressed.
- **Weekly or monthly chats**: Set aside 10 minutes to discuss bills, chore distribution, or house maintenance issues.
- **Keep it friendly**: Use these check-ins to sync up, cook a meal together, or watch a movie to build roommate rapport.
    `,
  },
  "room-inspection-checklist": {
    title: "Room Inspection Checklist: What to Look For",
    excerpt: "A comprehensive checklist for inspecting rooms before committing, from water pressure to mobile network coverage.",
    date: "January 2025",
    publishDate: "2025-01-15",
    readTime: "7 min read",
    category: "Guide",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&auto=format&fit=crop&q=80",
    content: `
Before committing to a room or flatmate listing, conducting a physical inspection of the property is critical. It is easy to miss hidden flaws during a quick 5-minute tour. Use this comprehensive inspection checklist to evaluate your next home.

## Plumbing, Water, and Bathrooms

Water issues are the most frequent complaint in urban apartments.
- **Water Pressure**: Turn on taps and showers to check the water pressure.
- **Geyser Functionality**: Ensure geysers in bathrooms are working and have adequate capacity.
- **Leakage and Dampness**: Look for water stains on walls, under sinks, and near bathroom doors. Dampness can lead to mold and respiratory issues.

## Electrical Outlets and Appliances

Make sure you can connect all your work and lifestyle devices safely.
- **Power Sockets**: Verify that sockets near the bed and study desk are functioning and grounded.
- **Power Backup**: Confirm if the society has a 24/7 generator backup that supports ACs and geysers.
- **Appliance Check**: Test shared appliances like refrigerators, washing machines, and microwave ovens.

## Mobile Network & Infrastructure

A home is also a workspace for WFH professionals.
- **Signal Strength**: Walk around the room and check your mobile network bars. Drop calls inside a room can be highly disruptive.
- **Internet Broadband**: Ask about the internet service providers (ISPs) active in the building and check fiber optic availability.
    `,
  },
  "flatmate-conflict-resolution": {
    title: "How to Handle Flatmate Conflicts Gracefully",
    excerpt: "Practical strategies for resolving common flatmate disagreements without damaging the relationship.",
    date: "December 2024",
    publishDate: "2024-12-10",
    readTime: "6 min read",
    category: "Community",
    image: "https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=1200&auto=format&fit=crop&q=80",
    content: `
Living in a shared apartment involves compromise. Disputes over cleaning duties, bills, or noise levels are natural. The key is to handle conflicts constructively before they escalate. Here are practical conflict resolution strategies.

## Talk in Person, Not on WhatsApp

Passive-aggressive messages in group chats are a recipe for escalation.
- **Face-to-face conversations**: Discuss issues in person. Text messages lack tone and can easily sound accusatory.
- **Choose the right moment**: Don't bring up issues when your roommate just returned from a stressful work day. Wait for a quiet, neutral moment.

## Refer to Your Flatmate Agreement

Having a baseline reference takes the personal bias out of the debate.
- **Objectivity**: Use the guidelines you agreed upon when moving in to resolve conflicts neutrally.
- **Update the rules**: If a rule isn't working, rewrite it together instead of holding grudges.

## Search for Compromises

Successful co-living requires flexibility from all parties.
- **Find the middle ground**: If one flatmate likes absolute quiet and the other likes playing music, agree to use headphones after 9:00 PM or restrict speakers to specific hours.
- **Take responsibility**: If you forgot to wash dishes or pay a bill on time, apologize and correct it immediately to build mutual trust.
    `,
  },
};

function LegacyBlogPostPage() {
  const { slug } = useParams<{ slug: string; }>();
  const post = BLOG_CONTENT[slug || ""];

  if (!post) {
    return (
      <>
        <SeoHelmet
          title="Post Not Found"
          description="This blog post does not exist or has been moved. Browse the 360 Flatmates blog for flatmate living guides and tips."
          canonicalUrl={`${SITE_URL}/blog/${slug ?? ""}`}
          noindex
        />
        <main id="main" className="page-fade mx-auto max-w-7xl px-5 py-20 text-center">
          <h1 className="text-h1">Post not found</h1>
          <p className="mt-4 text-body-lg text-ink-2">
            <Link to="/blog" className="text-accent hover:underline">
              Back to blog
            </Link>
          </p>
        </main>
      </>
    );
  }

  const url = `${SITE_URL}/blog/${slug}`;

  const articleLd = buildArticleSchema({
    headline: post.title,
    description: post.excerpt,
    image: post.image,
    datePublished: post.publishDate,
    url,
  });

  // HowTo schema for genuinely instructional posts.
  const howToLd = slug === "how-to-find-compatible-flatmates"
    ? buildHowToSchema({
        name: "How to Find Compatible Flatmates",
        description: "A structured process for evaluating flatmate compatibility before moving in together.",
        totalTime: "P1D",
        steps: [
          { name: "Understand your own preferences", text: "Reflect on your sleep schedule, cleanliness standards, food habits, guest policy, work style, and lifestyle preferences before evaluating others." },
          { name: "Use a structured questionnaire", text: "Ask specific questions about each of the 6 compatibility dimensions rather than relying on vibes alone." },
          { name: "Schedule a visit", text: "Meet in person at the property to assess the actual living conditions and the potential flatmate." },
          { name: "Check references", text: "Where possible, talk to their previous flatmates to validate what you've been told." },
          { name: "Start with a trial period", text: "Agree a month-to-month arrangement first so you can test compatibility before a long-term commitment." },
        ],
      })
    : slug === "room-inspection-checklist"
      ? buildHowToSchema({
          name: "How to Inspect a Room Before Renting",
          description: "A step-by-step inspection process to catch hidden issues before you sign a rental agreement.",
          totalTime: "PT1H",
          steps: [
            { name: "Check plumbing and water pressure", text: "Turn on taps and showers, verify geyser functionality, and look for leakage or dampness stains on walls and under sinks." },
            { name: "Test electrical outlets and appliances", text: "Verify power sockets near the bed and desk work, confirm society power backup, and test shared appliances like the fridge and washing machine." },
            { name: "Check mobile network and internet", text: "Walk around the room checking signal strength and ask which ISPs and fiber connections are available in the building." },
            { name: "Inspect security and locks", text: "Test door locks, window latches, and confirm whether CCTV and a security guard are present at the society gate." },
            { name: "Review the agreement and deposit terms", text: "Read the rental agreement carefully, confirm the deposit split, notice period, and what is included in the rent." },
          ],
        })
      : null;

  const speakableLd = buildSpeakableSchema(["article h1", "article .excerpt"], url);

  const renderContent = (content: string) => {
    return content.split("\n").filter(Boolean).map((line, i) => {
      if (line.startsWith("## ")) {
        return <h2 key={i} className="text-h2 font-normal mt-10 mb-4 text-ink">{line.replace("## ", "")}</h2>;
      }
      if (line.startsWith("### ")) {
        return <h3 key={i} className="text-h3 font-normal mt-8 mb-3 text-ink">{line.replace("### ", "")}</h3>;
      }
      if (line.startsWith("- **")) {
        const match = line.match(/- \*\*(.+?)\*\*:?\s+(.+)/);
        if (match) {
          return (
            <li key={i} className="flex gap-3 text-body-lg text-ink-2 mb-2 leading-relaxed">
              <span className="text-accent mt-1.5 select-none">•</span>
              <span><strong className="text-ink font-medium">{match[1]}</strong>: {match[2]}</span>
            </li>
          );
        }
      }
      if (line.startsWith("- ")) {
        return (
          <li key={i} className="flex gap-3 text-body-lg text-ink-2 mb-2 leading-relaxed">
            <span className="text-accent mt-1.5 select-none">•</span>
            <span>{line.replace("- ", "")}</span>
          </li>
        );
      }
      if (line.startsWith("**") && line.endsWith("**")) {
        return <p key={i} className="text-body-lg font-semibold text-ink mt-6 mb-2">{line.replace(/\*\*/g, "")}</p>;
      }
      if (line.trim()) {
        return <p key={i} className="text-body-lg text-ink-2 leading-relaxed mb-5">{line}</p>;
      }
      return null;
    });
  };

  return (
    <>
      <SeoHelmet
        title={post.title}
        description={post.excerpt}
        canonicalUrl={url}
        ogImage={post.image}
        ogType="article"
        breadcrumb={[{ name: "Blog", item: `${SITE_URL}/blog` }, { name: post.title, item: url }]}
        jsonLd={howToLd ? [articleLd, howToLd, speakableLd] : [articleLd, speakableLd]}
      />

      <main id="main" className="page-fade bg-paper">
        <article className="mx-auto max-w-3xl px-5 py-16 md:px-6">
          <div className="text-center mb-12">
            <span className="text-eyebrow text-accent uppercase tracking-widest">{post.category}</span>
            <h1 className="mt-4 text-display text-4xl md:text-5xl text-ink font-normal leading-tight tracking-tight">
              {post.title}
            </h1>
            <div className="mt-6 flex justify-center items-center gap-2 text-label-md text-ink-3">
              <span>{post.date}</span>
              <span>•</span>
              <span>{post.readTime}</span>
            </div>
            <p className="excerpt mt-6 text-body-lg text-ink-2 leading-relaxed max-w-2xl mx-auto">
              {post.excerpt}
            </p>
          </div>

          <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden mb-12 shadow-sm">
            <NetworkImage
              src={post.image}
              alt={post.title}
              className="h-full w-full object-cover"
              width={1200}
              height={630}
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          </div>

          <div className="prose max-w-[65ch] mx-auto">
            {renderContent(post.content)}
          </div>

          <div className="mt-20 pt-12 border-t border-line-low text-center max-w-2xl mx-auto relative overflow-hidden bg-surface/50 border border-line-low rounded-2xl p-8 shadow-xs">
            <div className="absolute top-[-30%] left-[-20%] w-[50%] aspect-square rounded-full bg-accent/5 blur-[80px] pointer-events-none" />
            <h2 className="text-display text-3xl text-ink font-normal">Find Your Compatible Flatmate</h2>
            <p className="mt-4 text-body-lg text-ink-2 leading-relaxed">
              Use our 6-dimension matching algorithm to connect with roommates who share your living style, schedules, and values.
            </p>
            <div className="mt-8">
              <Link
                to="/signup"
                className="inline-flex h-12 items-center justify-center rounded-[10px] bg-accent px-8 text-label-lg text-white shadow-cta hover:shadow-hover hover:scale-[1.02] active:scale-98 transition-all duration-300"
                style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </article>
      </main>
    </>
  );
}
