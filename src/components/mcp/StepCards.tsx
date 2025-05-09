import React from 'react';

export interface StepCard {
  title: string;
  description: string;
}

export interface StepCardsProps {
  cards: StepCard[];
}

/**
 * Renders three informational cards (What, Why, How) for each step.
 */
const StepCards: React.FC<StepCardsProps> = ({ cards }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {cards.map((card, idx) => (
        <div key={idx} className="bg-docs-section border border-docs-section-border p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-2 text-docs-text">
            {card.title}
          </h3>
          <p className="text-docs-muted text-sm">
            {card.description}
          </p>
        </div>
      ))}
    </div>
  );
};

export default StepCards;