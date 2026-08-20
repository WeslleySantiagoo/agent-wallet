import React from 'react';
import { useAIChat } from '../../context/AIChatContext';
import { Cpu } from 'lucide-react';

export const AIProviderSelector = () => {
  const { selectedProvider, setSelectedProvider, selectedModel, setSelectedModel, providersData } = useAIChat();

  const providerKeys = Object.keys(providersData || {});
  const modelsDict = providersData[selectedProvider] || {};
  const modelEntries = Object.entries(modelsDict);

  return (
    <div className="flex items-center gap-2 bg-[#181C14]/80 p-2 rounded-xl border border-[#3C3D37]">
      <Cpu className="w-4 h-4 text-[#697565] shrink-0" />
      
      {/* Provider Selector */}
      <select
        value={selectedProvider}
        onChange={(e) => {
          const newPid = e.target.value;
          setSelectedProvider(newPid);
          const newModels = Object.keys(providersData[newPid] || {});
          if (newModels.length > 0) {
            setSelectedModel(newModels[0]);
          }
        }}
        className="bg-[#3C3D37] text-[#ECDFCC] text-xs font-medium rounded-lg px-2 py-1 outline-none border border-[#4A4B44] cursor-pointer"
      >
        {providerKeys.map(pName => (
          <option key={pName} value={pName}>
            {pName}
          </option>
        ))}
      </select>

      {/* Model Selector */}
      <select
        value={selectedModel}
        onChange={(e) => setSelectedModel(e.target.value)}
        className="bg-[#3C3D37] text-[#ECDFCC] text-xs font-medium rounded-lg px-2 py-1 outline-none border border-[#4A4B44] cursor-pointer max-w-[170px] truncate"
      >
        {modelEntries.map(([mId, mData]) => {
          let displayName = mId;

          if (typeof mData === 'object' && mData !== null && !Array.isArray(mData)) {
            displayName = mData.name || mId;
          } else if (Array.isArray(mData)) {
            displayName = mData[0];
          }

          return (
            <option key={mId} value={mId}>
              {displayName}
            </option>
          );
        })}
      </select>
    </div>
  );
};
