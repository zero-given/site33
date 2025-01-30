import { Component } from 'solid-js';

export const BuyProfilesWidget: Component = () => {
  return (
    <div class="sticky top-[204px] w-[280px] bg-black/40 rd-lg border-2 border-blue-500/50 backdrop-blur-sm p-4 shadow-lg">
      <h2 class="text-lg font-semibold text-white mb-6">Buy Profiles</h2>
      
      {/* Sample content - replace with actual content */}
      <div class="space-y-4">
        <div class="bg-black/20 p-4 rd hover:bg-black/30 transition-colors cursor-pointer">
          <div class="text-sm text-gray-300">Basic Profile</div>
          <div class="text-white font-medium mt-1">$19.99</div>
        </div>
        
        <div class="bg-black/20 p-4 rd hover:bg-black/30 transition-colors cursor-pointer">
          <div class="text-sm text-gray-300">Pro Profile</div>
          <div class="text-white font-medium mt-1">$49.99</div>
        </div>
        
        <div class="bg-black/20 p-4 rd hover:bg-black/30 transition-colors cursor-pointer">
          <div class="text-sm text-gray-300">Enterprise Profile</div>
          <div class="text-white font-medium mt-1">$99.99</div>
        </div>
      </div>
      
      <button class="w-full mt-6 bg-blue-500/50 hover:bg-blue-500/70 text-white py-3 rd transition-colors">
        View All Profiles
      </button>
    </div>
  );
}; 