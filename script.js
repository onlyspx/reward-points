// Reward Points Tracker
class RewardPointsTracker {
    constructor() {
        this.data = this.loadData();
        this.chart = null;
        this.init();
    }

    // Load data from localStorage
    loadData() {
        const saved = localStorage.getItem('rewardPointsData');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            totalPoints: 0,
            dailyPoints: {},
            activities: [],
            lastReset: null
        };
    }

    // Save data to localStorage
    saveData() {
        localStorage.setItem('rewardPointsData', JSON.stringify(this.data));
    }

    // Initialize the app
    init() {
        this.setupEventListeners();
        this.updateDisplay();
        this.initChart();
        this.updateProgressBars();
    }

    // Setup event listeners
    setupEventListeners() {
        // Quick add point buttons
        document.querySelectorAll('.point-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const points = parseInt(e.target.dataset.points);
                this.addPoints(points, 'Quick Add');
            });
        });

        // Custom points input
        document.getElementById('addCustomPoints').addEventListener('click', () => {
            const input = document.getElementById('customPoints');
            const points = parseInt(input.value);
            if (points && points > 0 && points <= 100) {
                this.addPoints(points, 'Custom Points');
                input.value = '';
            } else {
                alert('Please enter a number between 1 and 100!');
            }
        });

        // Activity buttons
        document.querySelectorAll('.activity-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const activity = e.target.dataset.activity;
                const points = parseInt(e.target.dataset.points);
                const activityName = e.target.textContent.trim();
                this.addPoints(points, activityName);
                
                // Add visual feedback
                e.target.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    e.target.style.transform = '';
                }, 150);
            });
        });

        // Reset button
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.showResetModal();
        });

        // Modal buttons
        document.getElementById('confirmReset').addEventListener('click', () => {
            this.resetAllPoints();
            this.hideResetModal();
        });

        document.getElementById('cancelReset').addEventListener('click', () => {
            this.hideResetModal();
        });

        // Enter key for custom points
        document.getElementById('customPoints').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('addCustomPoints').click();
            }
        });
    }

    // Add points
    addPoints(points, activity) {
        const today = this.getTodayString();
        
        // Update total points
        this.data.totalPoints += points;
        
        // Update daily points
        if (!this.data.dailyPoints[today]) {
            this.data.dailyPoints[today] = 0;
        }
        this.data.dailyPoints[today] += points;
        
        // Add to activities list
        this.data.activities.unshift({
            activity: activity,
            points: points,
            timestamp: new Date().toISOString(),
            date: today
        });
        
        // Keep only last 50 activities
        if (this.data.activities.length > 50) {
            this.data.activities = this.data.activities.slice(0, 50);
        }
        
        // Save and update display
        this.saveData();
        this.updateDisplay();
        this.updateProgressBars();
        this.updateChart();
        this.showPointsAddedAnimation(points);
    }

    // Update display
    updateDisplay() {
        const today = this.getTodayString();
        const todayPoints = this.data.dailyPoints[today] || 0;
        
        // Update point displays
        document.getElementById('totalPoints').textContent = this.data.totalPoints;
        document.getElementById('todayPoints').textContent = todayPoints;
        
        // Update recent activities
        this.updateActivityList();
    }

    // Update progress bars
    updateProgressBars() {
        const today = this.getTodayString();
        const todayPoints = this.data.dailyPoints[today] || 0;
        
        // Calculate progress percentages (example: 100 points = 100%)
        const totalProgress = Math.min((this.data.totalPoints / 100) * 100, 100);
        const todayProgress = Math.min((todayPoints / 50) * 100, 100);
        
        document.getElementById('totalProgress').style.width = totalProgress + '%';
        document.getElementById('todayProgress').style.width = todayProgress + '%';
    }

    // Update activity list
    updateActivityList() {
        const activityList = document.getElementById('activityList');
        
        if (this.data.activities.length === 0) {
            activityList.innerHTML = '<div class="no-activity">No activities yet. Start earning points! 🚀</div>';
            return;
        }
        
        activityList.innerHTML = this.data.activities
            .slice(0, 10) // Show only last 10 activities
            .map(activity => {
                const time = new Date(activity.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                return `
                    <div class="activity-item">
                        <div class="activity-info">
                            <div class="activity-name">${activity.activity}</div>
                            <div class="activity-time">${time}</div>
                        </div>
                        <div class="activity-points">+${activity.points}</div>
                    </div>
                `;
            })
            .join('');
    }

    // Initialize chart
    initChart() {
        const ctx = document.getElementById('progressChart').getContext('2d');
        
        const chartData = this.getChartData();
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: 'Daily Points',
                    data: chartData.data,
                    borderColor: '#ff6b6b',
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#ff6b6b',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            color: '#666',
                            font: {
                                family: 'Comic Neue'
                            }
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            color: '#666',
                            font: {
                                family: 'Comic Neue'
                            }
                        }
                    }
                },
                elements: {
                    point: {
                        hoverBackgroundColor: '#ff6b6b'
                    }
                }
            }
        });
    }

    // Get chart data
    getChartData() {
        const today = new Date();
        const labels = [];
        const data = [];
        
        // Get last 7 days
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateString = this.formatDate(date);
            
            labels.push(this.formatDateForDisplay(date));
            data.push(this.data.dailyPoints[dateString] || 0);
        }
        
        return { labels, data };
    }

    // Update chart
    updateChart() {
        if (this.chart) {
            const chartData = this.getChartData();
            this.chart.data.labels = chartData.labels;
            this.chart.data.datasets[0].data = chartData.data;
            this.chart.update('none');
        }
    }

    // Show points added animation
    showPointsAddedAnimation(points) {
        const totalPointsElement = document.getElementById('totalPoints');
        totalPointsElement.classList.add('points-added');
        
        // Create floating points indicator
        const floatingPoints = document.createElement('div');
        floatingPoints.textContent = `+${points}`;
        floatingPoints.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #ff6b6b, #ee5a24);
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 2rem;
            font-weight: bold;
            z-index: 1000;
            pointer-events: none;
            animation: floatUp 1s ease-out forwards;
        `;
        
        document.body.appendChild(floatingPoints);
        
        setTimeout(() => {
            totalPointsElement.classList.remove('points-added');
            document.body.removeChild(floatingPoints);
        }, 1000);
    }

    // Show reset modal
    showResetModal() {
        document.getElementById('resetModal').style.display = 'block';
    }

    // Hide reset modal
    hideResetModal() {
        document.getElementById('resetModal').style.display = 'none';
    }

    // Reset all points
    resetAllPoints() {
        this.data.totalPoints = 0;
        this.data.dailyPoints = {};
        this.data.activities = [];
        this.data.lastReset = new Date().toISOString();
        
        this.saveData();
        this.updateDisplay();
        this.updateProgressBars();
        this.updateChart();
    }

    // Get today's date string
    getTodayString() {
        return new Date().toISOString().split('T')[0];
    }

    // Format date for display
    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    // Format date for chart display
    formatDateForDisplay(date) {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        }
    }
}

// Add floating animation CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes floatUp {
        0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
        100% {
            opacity: 0;
            transform: translate(-50%, -150%) scale(1.2);
        }
    }
`;
document.head.appendChild(style);

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new RewardPointsTracker();
});
