// Timeline.js - Core timeline functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize timeline functionality
    initTimeline();
});

function initTimeline() {
    // Timeline initialization logic
    const timelineEvents = document.querySelectorAll('.timeline-event');
    
    // Add visibility observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1
    });

    // Observe all timeline events
    timelineEvents.forEach(event => {
        observer.observe(event);
    });

    // Initialize filters if they exist
    initializeFilters();
}

function initializeFilters() {
    const filterButtons = document.querySelectorAll('.category-filter');
    if (!filterButtons.length) return;

    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            filterTimelineEvents(category);
            
            // Update active state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function filterTimelineEvents(category) {
    const events = document.querySelectorAll('.timeline-event');
    
    events.forEach(event => {
        if (category === 'all' || event.getAttribute('data-category') === category) {
            event.style.display = '';
            setTimeout(() => event.classList.add('visible'), 10);
        } else {
            event.classList.remove('visible');
            setTimeout(() => event.style.display = 'none', 300);
        }
    });
}

// Export functions for use in other scripts
window.TimelineJS = {
    init: initTimeline,
    filter: filterTimelineEvents
}; 