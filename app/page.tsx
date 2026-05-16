import Link from "next/link";

export default function HomePage() {
  const pillars = [
    {
      title: "Anthropic AI",
      description:
        "Explore Claude's powerful API and learn how to build intelligent applications with advanced prompt engineering techniques.",
      icon: "🧠",
    },
    {
      title: "Prompt Engineering",
      description:
        "Master the art of crafting effective prompts, chain-of-thought reasoning, and leveraging system prompts for optimal results.",
      icon: "✍️",
    },
    {
      title: "JavaScript & APIs",
      description:
        "Build robust integrations using JavaScript, Node.js, and RESTful APIs to connect AI services with your applications.",
      icon: "⚙️",
    },
  ];

  const roadmap = [
    { phase: "Fundamentals", items: ["Anthropic API basics", "Prompt patterns", "JavaScript ES6+"] },
    { phase: "Integration", items: ["Stream handling", "Error management", "API best practices"] },
    { phase: "Advanced", items: ["Multi-turn conversations", "Tool use", "Production deployments"] },
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Learning Anthropic AI
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl">
          A practical journey through prompt engineering, JavaScript, and APIs—building intelligent applications with Claude.
        </p>
      </section>

      {/* Three Pillars */}
      <section className="grid md:grid-cols-3 gap-6">
        {pillars.map((pillar, i) => (
          <div
            key={i}
            className="border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-indigo-300 transition-all"
          >
            <div className="text-4xl mb-3">{pillar.icon}</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{pillar.title}</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{pillar.description}</p>
          </div>
        ))}
      </section>

      {/* Learning Roadmap */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Learning Roadmap</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {roadmap.map((phase, i) => (
            <div key={i} className="bg-indigo-50 border border-indigo-100 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-indigo-900 mb-4">{phase.phase}</h3>
              <ul className="space-y-2">
                {phase.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-indigo-600 mt-1">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-8 text-center space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Ready to Start?</h2>
        <p className="text-gray-600">
          Explore the chat interface to test Claude&apos;s capabilities, or head to the operations page to dive deeper into your learning.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Link
            href="/chat"
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Open Chat
          </Link>
          <Link
            href="/operations"
            className="inline-flex items-center px-6 py-3 bg-white text-indigo-600 font-medium border border-indigo-300 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            Operations
          </Link>
        </div>
      </section>
    </div>
  );
}