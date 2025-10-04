import { Film, Mic, Type } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ProcessingViewProps {
  progress: number;
  currentStep: string;
}

export const ProcessingView = ({ progress, currentStep }: ProcessingViewProps) => {
  const steps = [
    { icon: Type, label: "Analyzing story", value: 33 },
    { icon: Film, label: "Generating visuals", value: 66 },
    { icon: Mic, label: "Creating narration", value: 100 },
  ];

  return (
    <section className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Crafting Your Story</h2>
          <p className="text-lg text-muted-foreground">
            This may take a few moments as we bring your narrative to life...
          </p>
        </div>

        <div className="space-y-8">
          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-3" />
            <p className="text-center text-sm text-muted-foreground">
              {progress}% Complete
            </p>
          </div>

          {/* Steps */}
          <div className="grid gap-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = progress >= step.value - 33 && progress < step.value;
              const isComplete = progress >= step.value;

              return (
                <div
                  key={step.label}
                  className={`
                    flex items-center gap-4 p-6 rounded-lg border transition-all duration-500
                    ${isActive 
                      ? 'border-primary bg-primary/5 shadow-glow scale-105' 
                      : isComplete
                      ? 'border-border bg-secondary/30'
                      : 'border-border bg-card opacity-60'
                    }
                  `}
                >
                  <div
                    className={`
                      p-3 rounded-full transition-colors duration-300
                      ${isActive || isComplete 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                      }
                    `}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-lg">{step.label}</p>
                    {isActive && (
                      <p className="text-sm text-muted-foreground mt-1 animate-pulse">
                        In progress...
                      </p>
                    )}
                    {isComplete && (
                      <p className="text-sm text-primary mt-1">
                        ✓ Complete
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Animated Loading Indicator */}
        <div className="flex justify-center mt-12">
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full bg-primary animate-pulse"
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1.4s',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
