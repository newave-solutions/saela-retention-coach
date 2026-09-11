import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Headphones,
  Mic,
  PhoneIncoming,
  Quote,
  Shield,
  Sparkles,
  Star,
  Waves,
} from "lucide-react";

import heroImage from "@/assets/landing-hero.jpg";
import { Reveal } from "@/components/landing/Reveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const FEATURES = [
  {
    icon: Mic,
    title: "Real voices, real pressure",
    body: "Callers speak out loud with their own voice, accent and mood. Some shout, some stonewall, some hang up on you.",
  },
  {
    icon: Shield,
    title: "A hidden reason every time",
    body: "Behind every cancellation is a motive the caller won't volunteer. Find it and the account becomes savable.",
  },
  {
    icon: BarChart3,
    title: "Graded on the Resolution Playbook",
    body: "Scored on help people, build value, over-communicate, trust and integrity, and hold the line together — with coaching you can act on.",
  },
  {
    icon: Waves,
    title: "It adapts as you talk",
    body: "The caller reacts to what you actually say. Rush the discount and you lose them; earn the trust and they listen.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Answer the call",
    body: "A cancellation comes through with a full account history, a personality and a mood.",
  },
  {
    n: "02",
    title: "Work the conversation",
    body: "Thank them, hear them out, own the miss, get clear on the problem, then ask for their price point.",
  },
  {
    n: "03",
    title: "Read your scorecard",
    body: "See the hidden motive, what saved or sank the call, and the exact line to try next time.",
  },
];

const REVIEWS = [
  {
    quote:
      "The first call I took, the guy cussed and hung up on me in forty seconds. Second week I was saving three out of five. Nothing else trains you like that.",
    name: "Dana R.",
    role: "Customer Experience Specialist",
  },
  {
    quote:
      "Our new hires used to burn live accounts learning. Now they burn practice accounts instead. Ramp time is down by half.",
    name: "Marcus W.",
    role: "Retention Team Lead",
  },
  {
    quote:
      "The hidden-motive thing is exactly how real calls work. People never tell you the real reason on the first ask.",
    name: "Alicia S.",
    role: "Customer Experience Manager",
  },
  {
    quote:
      "The scorecard finally gave me something to coach against. I can point at the exact moment ownership was missed.",
    name: "Curtis B.",
    role: "Branch Manager",
  },
  {
    quote:
      "I practice for ten minutes before my shift and go into the queue warm. My save rate has never been higher.",
    name: "Priya N.",
    role: "Retention Specialist",
  },
];

const FAQ = [
  {
    q: "Does it really cost nothing right now?",
    a: "Yes. We're in early-access testing, so calls, scoring and coaching are free while we tune the simulator. No card, no trial timer.",
  },
  {
    q: "Do I need a headset or special setup?",
    a: "Just a browser and a microphone. The caller speaks out loud and you answer with your voice, exactly like a live call.",
  },
  {
    q: "Is this only for pest control?",
    a: "The scenarios, pricing floors and save paths are written around pest control retention, which is what makes them feel real. The conversation skills carry anywhere.",
  },
  {
    q: "Who can see my calls?",
    a: "Your calls, transcripts and scores are tied to your own account and are private to you.",
  },
];

export function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg brand-surface">
              <Headphones className="h-4.5 w-4.5" />
            </span>
            <span className="font-display text-sm font-semibold leading-tight">
              Saela Way
              <span className="block text-[11px] font-normal text-muted-foreground">
                Retention Call Simulator
              </span>
            </span>
          </div>
          <div className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#how" className="transition-colors hover:text-foreground">
              How it works
            </a>
            <a href="#reviews" className="transition-colors hover:text-foreground">
              Reviews
            </a>
            <a href="#faq" className="transition-colors hover:text-foreground">
              FAQ
            </a>
          </div>
          <Button asChild size="sm">
            <Link to="/auth">Start free</Link>
          </Button>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-accent/25 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-48 -left-32 h-96 w-96 rounded-full bg-ring/20 blur-3xl"
          />
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:py-24 lg:grid-cols-2">
            <div>
              <Badge className="mb-5 gap-1.5 bg-accent text-accent-foreground hover:bg-accent">
                <Sparkles className="h-3.5 w-3.5" />
                Free during early access
              </Badge>
              <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
                Practice the cancellation call before it costs you the account.
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Live voice roleplay for pest control retention agents. Every caller has a hidden
                reason for leaving. Uncover it, work the Saela Way, and earn the save — then get a
                scorecard that tells you exactly what to fix.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="gap-2">
                  <Link to="/auth">
                    Take your first call free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="#how">See how it works</a>
                </Button>
              </div>
              <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" /> No card required
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" /> First call in under a minute
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" /> Your calls stay private
                </span>
              </p>
            </div>

            <div className="relative">
              <img
                src={heroImage}
                alt="Retention agent on a headset taking a live cancellation call"
                width={1280}
                height={960}
                className="card-soft w-full rounded-2xl border border-border object-cover"
              />
              <div className="card-soft absolute -bottom-5 left-4 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 sm:left-8">
                <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-accent/20 text-accent-foreground">
                  <span className="call-pulse absolute inset-0 rounded-full bg-accent/40" />
                  <PhoneIncoming className="relative h-4 w-4" />
                </span>
                <div className="text-xs">
                  <p className="font-semibold">Incoming: cancellation</p>
                  <p className="text-muted-foreground">Hidden motive unknown</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-border bg-secondary/60">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-3">
            {[
              { v: "36+", l: "Scripted cancellation scenarios" },
              { v: "10", l: "Caller personalities, from stonewaller to steamroller" },
              { v: "5", l: "Playbook values scored on every call" },
            ].map((s, i) => (
              <Reveal key={s.l} delay={i * 90} className="text-center">
                <p className="font-display text-4xl font-semibold">{s.v}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.l}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-4 py-20">
          <Reveal className="max-w-2xl">
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">
              Harder than the floor, so the floor feels easy
            </h2>
            <p className="mt-3 text-muted-foreground">
              This isn't a script quiz. It's a two-way conversation with someone who is already done
              with you.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 90}>
                <Card className="card-soft h-full border-border">
                  <CardContent className="pt-6">
                    <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <f.icon className="h-5 w-5" />
                    </span>
                    <h3 className="text-base font-semibold">{f.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="border-y border-border bg-secondary/40 scroll-mt-20">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <Reveal className="max-w-2xl">
              <h2 className="font-display text-3xl font-semibold sm:text-4xl">
                Three minutes, start to scorecard
              </h2>
            </Reveal>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <Reveal key={s.n} delay={i * 110}>
                  <div className="card-soft h-full rounded-xl border border-border bg-card p-6">
                    <p className="font-display text-3xl font-semibold text-accent">{s.n}</p>
                    <h3 className="mt-3 text-base font-semibold">{s.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Reviews carousel */}
        <section id="reviews" className="mx-auto max-w-6xl px-4 py-20 scroll-mt-20">
          <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-xl">
              <h2 className="font-display text-3xl font-semibold sm:text-4xl">
                What agents say after a week
              </h2>
              <p className="mt-3 text-muted-foreground">
                Early-access feedback from specialists, team leads and managers.
              </p>
            </div>
            <div className="flex items-center gap-1 text-accent">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
              <span className="ml-2 text-sm text-muted-foreground">4.9 average</span>
            </div>
          </Reveal>

          <Reveal>
            <Carousel opts={{ align: "start", loop: true }} className="w-full">
              <CarouselContent className="-ml-4">
                {REVIEWS.map((r) => (
                  <CarouselItem
                    key={r.name}
                    className="pl-4 sm:basis-1/2 lg:basis-1/3"
                  >
                    <Card className="card-soft h-full border-border">
                      <CardContent className="flex h-full flex-col pt-6">
                        <Quote className="h-6 w-6 text-accent" />
                        <p className="mt-4 flex-1 text-sm leading-relaxed">{r.quote}</p>
                        <div className="mt-6 border-t border-border pt-4">
                          <p className="text-sm font-semibold">{r.name}</p>
                          <p className="text-xs text-muted-foreground">{r.role}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden sm:flex" />
              <CarouselNext className="hidden sm:flex" />
            </Carousel>
          </Reveal>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-y border-border bg-secondary/40 scroll-mt-20">
          <div className="mx-auto max-w-3xl px-4 py-20">
            <Reveal>
              <h2 className="font-display text-3xl font-semibold sm:text-4xl">Questions, answered</h2>
            </Reveal>
            <Reveal className="mt-8">
              <Accordion type="single" collapsible className="w-full">
                {FAQ.map((item) => (
                  <AccordionItem key={item.q} value={item.q}>
                    <AccordionTrigger className="text-left text-base">{item.q}</AccordionTrigger>
                    <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Reveal>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="mx-auto max-w-6xl px-4 py-20">
          <Reveal>
            <div className="brand-surface card-soft overflow-hidden rounded-2xl px-6 py-14 text-center sm:px-12">
              <h2 className="font-display text-3xl font-semibold sm:text-4xl">
                Your next save starts with one practice call
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed opacity-90">
                Free while we're in early-access testing. Create an account, answer the call, and see
                your first scorecard in minutes.
              </p>
              <Button asChild size="lg" variant="secondary" className="mt-8 gap-2">
                <Link to="/auth">
                  Create your free account
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-8 text-xs text-muted-foreground">
          <p>Saela Way — Retention Call Simulator · Saela Pest Control customer experience training</p>
          <Link to="/auth" className="transition-colors hover:text-foreground">
            Sign in
          </Link>
        </div>
      </footer>
    </div>
  );
}
