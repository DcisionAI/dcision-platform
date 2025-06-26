import React from 'react';

interface DebateRound {
  agent: string;
  argument: string;
  timestamp: Date;
}

interface DebateSession {
  debateId: string;
  topic: string;
  rounds: DebateRound[];
  summary?: string;
  winner?: string;
}

interface DebateDisplayProps {
  debate: DebateSession;
}

export const DebateDisplay: React.FC<DebateDisplayProps> = ({ debate }) => {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Agent Debate</h3>
        <span className="text-sm text-gray-500">ID: {debate.debateId}</span>
      </div>
      
      <div className="mb-4">
        <h4 className="font-medium text-gray-800 mb-2">Topic</h4>
        <p className="text-gray-700 text-sm">{debate.topic}</p>
      </div>

      <div className="mb-4">
        <h4 className="font-medium text-gray-800 mb-2">Debate Rounds</h4>
        <div className="space-y-3">
          {debate.rounds.map((round, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-blue-600">{round.agent}</span>
                <span className="text-xs text-gray-500">
                  {round.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <p className="text-gray-700 text-sm">{round.argument}</p>
            </div>
          ))}
        </div>
      </div>

      {debate.summary && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-800 mb-2">Debate Summary</h4>
          <p className="text-gray-700 text-sm bg-blue-50 p-3 rounded">{debate.summary}</p>
        </div>
      )}

      {debate.winner && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-800 mb-2">Outcome</h4>
          <div className="flex items-center">
            <span className="text-sm text-gray-700">Winner: </span>
            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-sm font-medium rounded">
              {debate.winner}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

interface DebateListProps {
  debates: DebateSession[];
}

export const DebateList: React.FC<DebateListProps> = ({ debates }) => {
  if (debates.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No active debates at this time.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {debates.map((debate) => (
        <DebateDisplay key={debate.debateId} debate={debate} />
      ))}
    </div>
  );
}; 