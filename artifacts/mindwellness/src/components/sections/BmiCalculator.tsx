import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Activity } from "lucide-react";

export function BmiCalculator() {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [result, setResult] = useState<{ bmi: string; category: string; tip: string; color: string } | null>(null);

  const calculateBMI = (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseFloat(height) / 100; // cm to m
    const w = parseFloat(weight);

    if (h > 0 && w > 0) {
      const bmi = w / (h * h);
      const bmiStr = bmi.toFixed(1);
      
      if (bmi < 18.5) {
        setResult({ bmi: bmiStr, category: "Underweight", tip: "Consider nutritious, calorie-rich foods and consult a doctor.", color: "text-blue-600 bg-blue-50" });
      } else if (bmi < 25) {
        setResult({ bmi: bmiStr, category: "Normal", tip: "Great! Maintain your healthy lifestyle.", color: "text-blue-600 bg-blue-50" });
      } else if (bmi < 30) {
        setResult({ bmi: bmiStr, category: "Overweight", tip: "Consider more physical activity and a balanced diet.", color: "text-amber-600 bg-amber-50" });
      } else {
        setResult({ bmi: bmiStr, category: "Obese", tip: "Please consult a healthcare professional for a personalized plan.", color: "text-rose-600 bg-rose-50" });
      }
    }
  };

  return (
    <section id="bmi" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div>
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/20 mb-6">
              <Activity className="w-6 h-6 text-accent-foreground" />
            </div>
            <h2 className="text-4xl font-display font-medium mb-6">Physical Health Check</h2>
            <p className="text-lg text-muted-foreground mb-8 text-balance">
              Mental and physical wellness are deeply connected. Use this simple calculator to check your Body Mass Index as a general indicator of physical health.
            </p>
            
            <Card className="shadow-lg">
              <CardContent className="p-8">
                <form onSubmit={calculateBMI} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground ml-1">Height (cm)</label>
                      <Input 
                        type="number" 
                        placeholder="e.g. 175" 
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        required
                        className="h-12 rounded-xl bg-secondary/30 border-transparent focus:bg-white transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground ml-1">Weight (kg)</label>
                      <Input 
                        type="number" 
                        placeholder="e.g. 70" 
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        required
                        className="h-12 rounded-xl bg-secondary/30 border-transparent focus:bg-white transition-colors"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-12 text-base">Calculate BMI</Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center">
            {result ? (
              <div className={`w-full max-w-md p-10 rounded-[2.5rem] border ${result.color.replace('text-', 'border-').replace('bg-', 'bg-').split(' ')[1]} text-center shadow-2xl transition-all duration-500`}>
                <span className="text-sm font-medium uppercase tracking-widest opacity-80 block mb-4">Your Result</span>
                <div className="text-7xl font-display font-semibold mb-2">{result.bmi}</div>
                <div className={`text-2xl font-medium mb-6 ${result.color.split(' ')[0]}`}>{result.category}</div>
                <div className="w-16 h-1 bg-current mx-auto opacity-20 rounded-full mb-6"></div>
                <p className="text-lg opacity-90 leading-relaxed">{result.tip}</p>
              </div>
            ) : (
              <div className="w-full max-w-md aspect-square rounded-[2.5rem] border-2 border-dashed border-border flex items-center justify-center p-12 text-center text-muted-foreground">
                <p>Enter your details to see your wellness indicators.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
