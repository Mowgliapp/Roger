// charge.js
setInterval(updatePower, 1000);

function updatePower() {
  const count = parseInt(localStorage.getItem('count'), 10);
  const total = parseInt(localStorage.getItem('total'), 10);
  const power = parseInt(localStorage.getItem('power'), 10);

  if (!isNaN(total) && !isNaN(power) && total > power) {
    const newPower = power + count;
    localStorage.setItem('power', newPower);
  }
}