import { Component } from 'solid-js';
import { Shield, Lock, Key, Info } from 'lucide-solid';
import type { Token } from '../types';
import { TrendBadge } from './TrendBadge';
import { TokenPrice } from './TokenPrice';
import { MiniChart } from './MiniChart';

interface TokenTileCardProps {
  token: Token;
  onClick: (e: MouseEvent) => void;
  trends?: {
    liquidity: 'up' | 'down' | 'stagnant';
    holders: 'up' | 'down' | 'stagnant';
  };
  history?: any[];
  dynamicScaling?: boolean;
}

const securityStatus = {
  safe: 'bg-green-100 text-green-800 border border-green-200',
  warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  danger: 'bg-red-100 text-red-800 border border-red-200'
} as const;

export const TokenTileCard: Component<TokenTileCardProps> = (props) => {
  const formatNumber = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const getLiquidityInfo = () => {
    try {
      const lpHolders = JSON.parse(props.token.gpLpHolders || '[]');
      const dexInfo = JSON.parse(props.token.gpDexInfo || '[]');
      
      return {
        lpHolders,
        dexInfo,
        totalLocked: lpHolders.reduce((acc: number, holder: any) => 
          acc + (holder.is_locked ? Number(holder.percent) * 100 : 0), 0
        ),
        totalLiquidity: dexInfo[0]?.liquidity || 0
      };
    } catch {
      return { lpHolders: [], dexInfo: [], totalLocked: 0, totalLiquidity: 0 };
    }
  };

  const liquidityInfo = getLiquidityInfo();

  return (
    <div 
      onClick={props.onClick}
      class="w-full h-full bg-black/20 hover:bg-black/40 backdrop-blur-sm rd-lg border border-gray-700/50 hover:border-gray-600/50 overflow-hidden cursor-pointer transition-all duration-200"
    >
      <div class="p-4 flex flex-col h-full">
        {/* Header section with all elements in one row */}
        <div class="flex items-center justify-between mb-4">
          {/* Left side: Token name and symbol */}
          <div class="flex-1 min-w-0 mr-4">
            <h3 class="text-lg fw-600 text-white truncate" title={props.token.tokenName}>
              {props.token.tokenName}
            </h3>
            <p class="text-sm text-gray-400 truncate" title={props.token.tokenAddress}>
              {props.token.tokenSymbol} • {props.token.tokenAddress.slice(0, 8)}...{props.token.tokenAddress.slice(-6)}
            </p>
          </div>

          {/* Right side: Price, Risk level, and Age */}
          <div class="flex items-center gap-3 shrink-0">
            <TokenPrice token={props.token} class="!text-sm" showBothFormats={true} />
            <div class="w-[75px] h-[28px] flex-shrink-0 flex items-center justify-center text-center px-2.5 py-1.5 rd text-xs bg-yellow-500/10 text-yellow-300 border border-yellow-500/30">
              {props.token.gpBuyTax}% / {props.token.gpSellTax}%
            </div>
            <span class="w-[75px] h-[28px] flex-shrink-0 flex items-center justify-center text-center px-2.5 py-1.5 rd text-xs bg-yellow-500/10 text-yellow-300 border border-yellow-500/30">
              {(() => {
                const totalMinutes = Math.round(props.token.tokenAgeHours * 60);
                const hours = Math.floor(totalMinutes / 60);
                const minutes = totalMinutes % 60;
                if (hours > 0) {
                  return `${hours}h ${minutes}m`;
                }
                return `${minutes}m`;
              })()}
            </span>
            <span class={`w-[75px] h-[28px] flex-shrink-0 flex items-center justify-center text-center px-2.5 py-1.5 rd text-xs ${securityStatus[props.token.riskLevel]}`}>
              {props.token.hpIsHoneypot ? 'HONEYPOT' : props.token.riskLevel.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Charts Section - Horizontal layout */}
        <div class="grid grid-cols-2 gap-4 mb-4">
          {/* Holders Chart */}
          <div class="bg-black/10 p-2 rd">
            <div class="flex justify-between items-center mb-2">
              <p class="text-gray-400 text-sm">Holders</p>
              <p class="text-white fw-600 text-sm">{formatNumber(props.token.gpHolderCount)}</p>
            </div>
            {props.history && (
              <MiniChart
                token={props.token}
                history={props.history}
                type="holders"
                dynamicScaling={props.dynamicScaling}
              />
            )}
          </div>

          {/* Liquidity Chart */}
          <div class="bg-black/10 p-2 rd">
            <div class="flex justify-between items-center mb-2">
              <p class="text-gray-400 text-sm">Liquidity</p>
              <p class="text-white fw-600 text-sm">${formatNumber(props.token.hpLiquidityAmount)}</p>
            </div>
            {props.history && (
              <MiniChart
                token={props.token}
                history={props.history}
                type="liquidity"
                dynamicScaling={props.dynamicScaling}
              />
            )}
          </div>
        </div>

        {/* Main Info Grid - Two columns */}
        <div class="grid grid-cols-2 gap-6 mb-4">
          {/* Left Column */}
          <div class="space-y-1">
            <p class={`fw-600 flex items-center gap-1 px-2 py-0.5 rd text-sm ${
              props.token.gpOwnerAddress === '0x0000000000000000000000000000000000000000'
                ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                : 'bg-red-500/20 text-red-300 border border-red-500/30'
            }`}>
              <Key size={14} class="text-current" />
              {props.token.gpOwnerAddress === '0x0000000000000000000000000000000000000000' ? 'Renounced' : 'Owned'}
            </p>
            <p class="text-gray-300 text-xs flex items-center gap-2">
              <span class="shrink-0 text-white">Creator:</span>
              <span class="truncate opacity-60">{props.token.gpCreatorAddress}</span>
            </p>
            <p class="text-gray-300 text-xs flex items-center gap-2">
              <span class="shrink-0 text-white">Owner:</span>
              <span class="truncate opacity-60">{props.token.gpOwnerAddress}</span>
            </p>
          </div>

          {/* Right Column - Liquidity Info */}
          <div class="space-y-2">
            <div class="space-y-1">
              <p class={`text-sm fw-600 flex items-center gap-1 px-2 py-0.5 rd ${
                liquidityInfo.totalLocked > 90 
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                  : liquidityInfo.totalLocked > 50 
                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' 
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}>
                <Lock size={14} />
                {liquidityInfo.totalLocked.toFixed(2)}% Locked
              </p>
              {liquidityInfo.lpHolders.slice(0, 2).map((holder: any) => (
                <p class="text-gray-300 text-xs flex items-center gap-2">
                  <span class="shrink-0 text-white">{(Number(holder.percent) * 100).toFixed(2)}%</span>
                  <span class="truncate opacity-60">{holder.tag || holder.address}</span>
                  {holder.is_locked && <Lock size={12} class="shrink-0" />}
                </p>
              ))}
              {liquidityInfo.dexInfo.map((dex: any) => (
                <p class="text-white text-sm">
                  {dex.name}: ${Number(dex.liquidity).toLocaleString()}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 

