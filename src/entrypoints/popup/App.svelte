<script lang="ts">
  import PomodoroTimer from '../../lib/PomodoroTimer.svelte'

  let badgeTimeLeft = 0;
  let badgeIsRunning = false;
  let badgeMode: 'work' | 'break' = 'work';

  function handleTimerUpdate(timeLeft: number, isRunning: boolean, mode: 'work' | 'break') {
    badgeTimeLeft = timeLeft;
    badgeIsRunning = isRunning;
    badgeMode = mode;
  }
</script>

<main>
  <PomodoroTimer onTimerUpdate={handleTimerUpdate} />
</main>

<style>
  main {
    padding: 0;
    margin: 0;
    min-height: 300px;
    display: flex;
    flex-direction: column;
  }

</style>
