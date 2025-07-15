const cameraIds = ['1111', '1221', '2121', '2425', '2633', '2342', '2233', '3001', '1211'];

document.addEventListener('DOMContentLoaded', () => {
  const randomLink = document.getElementById('random-link');
  const sortSelect = document.querySelector('.select1');

  if (randomLink) {
    randomLink.addEventListener('click', (e) => {
      e.preventDefault();
      const randomId = cameraIds[Math.floor(Math.random() * cameraIds.length)];
      window.location.href = `cameraid${randomId}.html`;
    });
  } else {
    console.error('Random camera link not found');
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      const sortOption = e.target.value;
      console.log(`Sorting cameras by: ${sortOption}`);
      // Backend sorting not implemented
    });
  } else {
    console.error('Sort select element not found');
  }
});