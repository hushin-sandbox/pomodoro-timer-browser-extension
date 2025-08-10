export interface TimerState {
  timeLeft: number;
  isRunning: boolean;
  mode: 'work' | 'break';
  completedPomodoros: number;
  lastUpdate: number;
}

export const WORK_TIME = 25 * 60;
export const BREAK_TIME = 5 * 60;

export const createInitialTimerState = (): TimerState => ({
  timeLeft: WORK_TIME,
  isRunning: false,
  mode: 'work',
  completedPomodoros: 0,
  lastUpdate: Date.now(),
});