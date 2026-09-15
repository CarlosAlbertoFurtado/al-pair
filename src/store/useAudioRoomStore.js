import { create } from 'zustand';

export const useAudioRoomStore = create((set) => ({
  activeRoom: null, // contém os dados do LiveKit { token, livekitUrl, roomId, roomName, isHost }
  isMinimized: false,
  setActiveRoom: (roomData) => set({ activeRoom: roomData, isMinimized: false }),
  setMinimized: (minimized) => set({ isMinimized: minimized }),
  clearRoom: () => set({ activeRoom: null, isMinimized: false }),
}));
