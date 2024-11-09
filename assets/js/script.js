function createFloatingText(event) {
    // Prevent default touch behavior
    event.preventDefault();
    
    // Get click/touch coordinates
    const x = event.type.includes('touch') ? 
        event.touches[0].clientX : 
        event.clientX;
    const y = event.type.includes('touch') ? 
        event.touches[0].clientY : 
        event.clientY;
    
    // Create floating text element
    const floatingText = document.createElement('div');
    floatingText.className = 'floating-click';
    floatingText.textContent = '+1';
    
    // Position the text at click/touch location
    floatingText.style.left = `${x - 20}px`; // Offset by half the element width
    floatingText.style.top = `${y - 20}px`; // Offset by half the element height
    
    // Add to document
    document.body.appendChild(floatingText);
    
    // Remove element after animation
    setTimeout(() => {
        floatingText.remove();
    }, 3000); // Match this with animation duration (3s)
}

// Add event listeners
const coin = document.getElementById('coin');
if (coin) {
    coin.addEventListener('click', createFloatingText);
    coin.addEventListener('touchstart', createFloatingText, { passive: false });
}

// Prevent default touch behavior on the coin
coin.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false }); 