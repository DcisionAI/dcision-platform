import Layout from '@/components/Layout';
import {
  BeakerIcon,
  BoltIcon,
  ChartBarIcon,
  CpuChipIcon,
  LightBulbIcon,
  ArrowPathRoundedSquareIcon,
} from '@heroicons/react/24/outline';

function FeatureCard({ icon: Icon, title, description }: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="border border-docs-section-border shadow-sm rounded-xl p-6 bg-docs-section hover:bg-docs-section/80 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-[#1F6FEB]/10 rounded-lg">
          <Icon className="w-5 h-5 text-[#1F6FEB]" />
        </div>
        <h2 className="text-xl font-semibold text-docs-text">{title}</h2>
      </div>
      <p className="text-docs-muted">{description}</p>
    </div>
  );
}

export default function Home() {
  const features = [
    {
      icon: CpuChipIcon,
      title: "Intelligent Decision Agents",
      description: "Our AI agents understand your business context, validate decisions against rules, and ensure optimal outcomes while maintaining explainability."
    },
    {
      icon: BoltIcon,
      title: "Real-time Optimization",
      description: "Adapt to changing conditions instantly with dynamic re-optimization. Handle disruptions, new constraints, and opportunities in real-time."
    },
    {
      icon: LightBulbIcon,
      title: "Business-First Approach",
      description: "No PhD required. Express your business rules naturally, and let our agents translate them into optimal decisions that align with your goals."
    },
    {
      icon: ArrowPathRoundedSquareIcon,
      title: "Continuous Learning",
      description: "Your decisions get better over time. Our agents learn from outcomes, stakeholder feedback, and changing business conditions."
    },
    {
      icon: BeakerIcon,
      title: "Interactive Playground",
      description: "Test and refine your decision workflows in a risk-free environment. Experiment with different scenarios and see results instantly."
    },
    {
      icon: ChartBarIcon,
      title: "Decision Intelligence",
      description: "Get deep insights into your decisions. Understand trade-offs, identify opportunities, and quantify the impact of each choice."
    }
  ];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 pt-2 pb-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3 text-docs-text bg-clip-text text-transparent bg-gradient-to-r from-[#1F6FEB] to-[#58A6FF]">
            DcisionAI
          </h1>
          <p className="text-lg mb-6 text-docs-muted max-w-3xl mx-auto">
            Transform complex business decisions into intelligent workflows. Powered by explainable AI agents that understand your business context.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>

        <div className="border border-docs-section-border shadow-sm rounded-xl p-6 bg-docs-section">
          <h2 className="text-xl font-semibold mb-3 text-docs-text">Get Started in Minutes</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {[
              { step: "1", text: "Connect your data sources" },
              { step: "2", text: "Choose a decision workflow template" },
              { step: "3", text: "Configure business rules and goals" },
              { step: "4", text: "Deploy and monitor decisions" }
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#1F6FEB]/10 flex items-center justify-center text-[#1F6FEB] font-semibold">
                  {item.step}
                </div>
                <p className="text-docs-muted text-sm">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
} 