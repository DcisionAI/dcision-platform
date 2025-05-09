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
        <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">
            {card.title}
          </h3>
          <p className="text-gray-700 dark:text-gray-300 text-sm">
            {card.description}
          </p>
        </div>
      ))}
    </div>
  );
};

export default StepCards;