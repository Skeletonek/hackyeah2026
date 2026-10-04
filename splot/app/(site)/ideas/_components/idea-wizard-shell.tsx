import { Stepper } from "@/components/stepper";
import { IDEA_STEPS, ideaStepHref, type IdeaStep } from "@/lib/ideas/card";
import { cn } from "@/lib/utils";

/**
 * Frame of the idea card wizard: the title, the stepper and the step itself,
 * with a slot beside it for the idea assistant panel.
 */
export function IdeaWizardShell({
  title,
  step,
  id,
  call,
  assistant,
  children,
}: {
  title: string;
  step: IdeaStep;
  /** Missing until the first save; finished steps then stay plain text. */
  id?: string;
  call?: string;
  /** The idea assistant panel; without it the step takes one readable column. */
  assistant?: React.ReactNode;
  children: React.ReactNode;
}) {
  const steps = IDEA_STEPS.map(({ label }, index) => ({
    label,
    href: id ? ideaStepHref(id, (index + 1) as IdeaStep, call) : undefined,
  }));

  return (
    <main id="main-content" className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-4 py-10 sm:px-8">
      <div className="flex max-w-[760px] flex-col gap-6">
        <h1 className="text-h1 simple:text-simple-h1">{title}</h1>
        <Stepper steps={steps} current={step} />
      </div>
      <div className={cn("grid gap-8", assistant && "lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start")}>
        <section aria-labelledby="idea-step-heading" className="flex w-full max-w-[760px] min-w-0 flex-col gap-6">
          <h2 id="idea-step-heading" className="text-h2 simple:text-simple-h2">
            {IDEA_STEPS[step - 1].heading}
          </h2>
          {children}
        </section>
        {assistant && <aside className="min-w-0">{assistant}</aside>}
      </div>
    </main>
  );
}
