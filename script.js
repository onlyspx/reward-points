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
            lastReset: null,
            badges: {},
            activityCounts: {},
            dailyActivities: {}, // Track activities completed today
            settings: {
                kidName: 'Vir',
                startingPoints: 0,
                dailyLimit: 50
            }
        };
    }

    // Save data to localStorage
    saveData() {
        localStorage.setItem('rewardPointsData', JSON.stringify(this.data));
    }

    // Initialize the app
    init() {
        console.log('Initializing app...');
        this.checkMidnightReset();
        this.setupEventListeners();
        this.loadSettings();
        this.updateDisplay();
        this.initChart();
        this.updateProgressBars();
        this.initBadges();
        this.updateBadges();
        this.updateActivityButtons();
        console.log('App initialized successfully');
    }

    // Setup event listeners
    setupEventListeners() {
        // Quick add point buttons
        document.querySelectorAll('.point-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const points = parseInt(e.target.dataset.points);
                this.addPoints(points, 'Quick Add', 'Quick Add');
            });
        });

        // Custom points input
        document.getElementById('addCustomPoints').addEventListener('click', () => {
            const input = document.getElementById('customPoints');
            const points = parseInt(input.value);
            if (points && points > 0 && points <= 100) {
                this.addPoints(points, 'Custom Points', 'Custom Points');
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
                
                // Check if activity is already completed
                const today = this.getTodayString();
                const todayActivities = this.data.dailyActivities[today] || {};
                const isCompleted = todayActivities[activity];
                
                if (isCompleted) {
                    this.showActivityCompletionInfo(activity);
                    return;
                }
                
                this.addPoints(points, activity, activityName);
                
                // Add visual feedback
                e.target.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    e.target.style.transform = '';
                }, 150);
            });
        });

        // Settings button
        const settingsBtn = document.getElementById('settingsBtn');
        console.log('Settings button found:', settingsBtn);
        
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                console.log('Settings button clicked');
                this.showSettingsModal();
            });
        } else {
            console.error('Settings button not found!');
        }

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

        // Settings modal buttons
        document.getElementById('saveSettings').addEventListener('click', () => {
            this.saveSettings();
        });

        document.getElementById('closeSettings').addEventListener('click', () => {
            this.hideSettingsModal();
        });

        // Close modals when clicking outside
        document.getElementById('badgeModal').addEventListener('click', (e) => {
            if (e.target.id === 'badgeModal') {
                this.hideBadgeModal();
            }
        });

        document.getElementById('settingsModal').addEventListener('click', (e) => {
            if (e.target.id === 'settingsModal') {
                this.hideSettingsModal();
            }
        });

        // Badge modal close button
        document.getElementById('closeBadgeModal').addEventListener('click', () => {
            this.hideBadgeModal();
        });

        // Enter key for custom points
        document.getElementById('customPoints').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('addCustomPoints').click();
            }
        });
    }

    // Add points
    addPoints(points, activityId, activityName) {
        const today = this.getTodayString();
        
        // Check if activity already completed today (except brushing, restroom, and quick add)
        if (!this.data.dailyActivities[today]) {
            this.data.dailyActivities[today] = {};
        }
        
        const isBrushing = activityId.includes('brush-teeth');
        const isRestroom = activityId === 'use-restroom';
        const isQuickAdd = activityId === 'Quick Add' || activityId === 'Custom Points';
        const activityCompleted = this.data.dailyActivities[today][activityId];
        
        if (activityCompleted && !isBrushing && !isQuickAdd && !isRestroom) {
            this.showActivityAlreadyCompletedMessage(activityId);
            return;
        }
        
        if (isBrushing && activityCompleted) {
            this.showActivityAlreadyCompletedMessage(activityId);
            return;
        }
        
        // Check daily point limit (configurable)
        if (!this.data.dailyPoints[today]) {
            this.data.dailyPoints[today] = 0;
        }
        
        const currentDailyPoints = this.data.dailyPoints[today];
        const dailyLimit = this.data.settings.dailyLimit || 50;
        const remainingDailyPoints = dailyLimit - currentDailyPoints;
        
        if (remainingDailyPoints <= 0) {
            this.showDailyLimitMessage();
            return;
        }
        
        // Adjust points if it would exceed daily limit
        const actualPoints = Math.min(points, remainingDailyPoints);
        
        // Update total points
        this.data.totalPoints += actualPoints;
        
        // Update daily points
        this.data.dailyPoints[today] += actualPoints;
        
        // Mark activity as completed today (except quick add and restroom)
        if (!isQuickAdd && !isRestroom) {
            this.data.dailyActivities[today][activityId] = true;
        }
        
        // Update activity counts for badges
        if (!this.data.activityCounts[activityId]) {
            this.data.activityCounts[activityId] = 0;
        }
        this.data.activityCounts[activityId]++;
        
        // Add to activities list
        this.data.activities.unshift({
            activity: activityName,
            points: actualPoints,
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
        this.updateBadges();
        this.updateActivityButtons();
        this.showPointsAddedAnimation(actualPoints);
        
        // Show message if points were adjusted
        if (actualPoints < points) {
            this.showPointsAdjustedMessage(points, actualPoints);
        }
    }

    // Update display
    updateDisplay() {
        const today = this.getTodayString();
        const todayPoints = this.data.dailyPoints[today] || 0;
        
        // Update point displays
        document.getElementById('totalPoints').textContent = this.data.totalPoints;
        document.getElementById('todayPoints').textContent = todayPoints;
        
        // Update header with kid's name
        const kidName = this.data.settings.kidName || 'Vir';
        document.querySelector('.header h1').textContent = `🎉 ${kidName}'s Reward Points!`;
        document.title = `🎉 ${kidName}'s Reward Points!`;
        
        // Update recent activities
        this.updateActivityList();
    }

    // Update progress bars
    updateProgressBars() {
        const today = this.getTodayString();
        const todayPoints = this.data.dailyPoints[today] || 0;
        const dailyLimit = this.data.settings.dailyLimit || 50;
        
        // Calculate progress percentages (configurable daily limit, 100 points = 100% for total)
        const totalProgress = Math.min((this.data.totalPoints / 100) * 100, 100);
        const todayProgress = Math.min((todayPoints / dailyLimit) * 100, 100);
        
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
            .map((activity, index) => {
                const time = new Date(activity.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                return `
                    <div class="activity-item" data-index="${index}">
                        <div class="activity-info">
                            <div class="activity-name">${activity.activity}</div>
                            <div class="activity-time">${time}</div>
                        </div>
                        <div class="activity-points">+${activity.points}</div>
                        <button class="undo-btn" onclick="rewardTracker.undoActivity(${index})" title="Undo this activity">↶</button>
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

    // Initialize badges
    initBadges() {
        this.badges = [
            {
                id: 'first-points',
                name: 'First Steps!',
                description: 'Earn your first 10 points',
                icon: '🌟',
                requirement: { type: 'totalPoints', value: 10 }
            },
            {
                id: 'piano-master',
                name: 'Piano Master',
                description: 'Practice piano 5 times',
                icon: '🎹',
                requirement: { type: 'activity', value: 5, activity: 'piano-practice' }
            },
            {
                id: 'reading-champion',
                name: 'Reading Champion',
                description: 'Read 10 times',
                icon: '📚',
                requirement: { type: 'activity', value: 10, activity: 'reading-10min' }
            },
            {
                id: 'clean-hero',
                name: 'Clean Room Hero',
                description: 'Clean room 3 times',
                icon: '🧹',
                requirement: { type: 'activity', value: 3, activity: 'clean-room' }
            },
            {
                id: 'swimming-star',
                name: 'Swimming Star',
                description: 'Go swimming 3 times',
                icon: '🏊',
                requirement: { type: 'activity', value: 3, activity: 'swimming' }
            },
            {
                id: 'math-wizard',
                name: 'Math Wizard',
                description: 'Do maths 5 times',
                icon: '➗',
                requirement: { type: 'activity', value: 5, activity: 'maths-10min' }
            },
            {
                id: 'good-behavior',
                name: 'Good Behavior',
                description: 'Show good behavior 10 times',
                icon: '😊',
                requirement: { type: 'activity', value: 10, activity: 'good-behavior' }
            },
            {
                id: 'soccer-player',
                name: 'Soccer Player',
                description: 'Play soccer 3 times',
                icon: '⚽',
                requirement: { type: 'activity', value: 3, activity: 'soccer' }
            },
            {
                id: 'spanish-learner',
                name: 'Spanish Learner',
                description: 'Practice Spanish 5 times',
                icon: '🇪🇸',
                requirement: { type: 'activity', value: 5, activity: 'spanish' }
            },
            {
                id: 'point-master',
                name: 'Point Master',
                description: 'Earn 100 total points',
                icon: '👑',
                requirement: { type: 'totalPoints', value: 100 }
            },
            {
                id: 'daily-champion',
                name: 'Daily Champion',
                description: 'Earn 20 points in one day',
                icon: '🏆',
                requirement: { type: 'dailyPoints', value: 20 }
            },
            {
                id: 'consistent',
                name: 'Consistent',
                description: 'Earn points 3 days in a row',
                icon: '📅',
                requirement: { type: 'streak', value: 3 }
            }
        ];
        
        this.renderBadges();
    }

    // Render badges
    renderBadges() {
        const badgesGrid = document.getElementById('badgesGrid');
        badgesGrid.innerHTML = this.badges.map(badge => `
            <div class="badge" id="badge-${badge.id}" data-badge-id="${badge.id}">
                <span class="badge-icon">${badge.icon}</span>
                <div class="badge-name">${badge.name}</div>
                <div class="badge-description">${badge.description}</div>
                <div class="badge-progress" id="progress-${badge.id}"></div>
            </div>
        `).join('');
        
        // Add click event listeners to badges
        this.badges.forEach(badge => {
            const badgeElement = document.getElementById(`badge-${badge.id}`);
            badgeElement.addEventListener('click', () => {
                this.showBadgeDetail(badge);
            });
        });
        

    }

    // Update badges
    updateBadges() {
        this.badges.forEach(badge => {
            const isUnlocked = this.checkBadgeUnlocked(badge);
            const badgeElement = document.getElementById(`badge-${badge.id}`);
            const progressElement = document.getElementById(`progress-${badge.id}`);
            
            if (isUnlocked) {
                if (!this.data.badges[badge.id]) {
                    // Newly unlocked!
                    this.data.badges[badge.id] = {
                        unlockedAt: new Date().toISOString(),
                        isNew: true
                    };
                    this.showBadgeUnlockAnimation(badgeElement);
                }
                badgeElement.classList.add('unlocked');
                progressElement.textContent = '✅ Unlocked!';
            } else {
                badgeElement.classList.remove('unlocked');
                const progress = this.getBadgeProgress(badge);
                progressElement.textContent = progress;
            }
        });
        
        this.saveData();
    }

    // Check if badge is unlocked
    checkBadgeUnlocked(badge) {
        const req = badge.requirement;
        
        switch (req.type) {
            case 'totalPoints':
                return this.data.totalPoints >= req.value;
            
            case 'activity':
                const count = this.data.activityCounts[req.activity] || 0;
                return count >= req.value;
            
            case 'dailyPoints':
                const today = this.getTodayString();
                const todayPoints = this.data.dailyPoints[today] || 0;
                return todayPoints >= req.value;
            
            case 'streak':
                return this.getCurrentStreak() >= req.value;
            
            default:
                return false;
        }
    }

    // Get badge progress
    getBadgeProgress(badge) {
        const req = badge.requirement;
        
        switch (req.type) {
            case 'totalPoints':
                return `${this.data.totalPoints}/${req.value} points`;
            
            case 'activity':
                const count = this.data.activityCounts[req.activity] || 0;
                return `${count}/${req.value} times`;
            
            case 'dailyPoints':
                const today = this.getTodayString();
                const todayPoints = this.data.dailyPoints[today] || 0;
                return `${todayPoints}/${req.value} points today`;
            
            case 'streak':
                const streak = this.getCurrentStreak();
                return `${streak}/${req.value} days`;
            
            default:
                return '';
        }
    }

    // Get current streak
    getCurrentStreak() {
        const today = new Date();
        let streak = 0;
        let currentDate = new Date(today);
        
        while (true) {
            const dateString = this.formatDate(currentDate);
            if (this.data.dailyPoints[dateString] && this.data.dailyPoints[dateString] > 0) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }
        
        return streak;
    }

    // Format date helper
    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    // Show badge unlock animation
    showBadgeUnlockAnimation(badgeElement) {
        badgeElement.classList.add('unlock-animation');
        
        // Create confetti effect
        this.createConfetti();
        
        // Show notification
        this.showBadgeNotification(badgeElement.querySelector('.badge-name').textContent);
        
        setTimeout(() => {
            badgeElement.classList.remove('unlock-animation');
        }, 1000);
    }

    // Create confetti effect
    createConfetti() {
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                top: -10px;
                left: ${Math.random() * 100}vw;
                width: 10px;
                height: 10px;
                background: ${['#ffb347', '#ffcc5c', '#87ceeb', '#98d8e8', '#e67e22'][Math.floor(Math.random() * 5)]};
                border-radius: 50%;
                pointer-events: none;
                z-index: 1000;
                animation: confettiFall 3s linear forwards;
            `;
            document.body.appendChild(confetti);
            
            setTimeout(() => {
                document.body.removeChild(confetti);
            }, 3000);
        }
    }

    // Show badge notification
    showBadgeNotification(badgeName) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #ffb347 0%, #ffcc5c 100%);
            color: #2c3e50;
            padding: 15px 20px;
            border-radius: 15px;
            box-shadow: 0 8px 25px rgba(255, 179, 71, 0.3);
            border: 3px solid #e67e22;
            font-weight: bold;
            z-index: 1001;
            animation: slideIn 0.5s ease-out;
        `;
        notification.textContent = `🏆 New Badge: ${badgeName}!`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.5s ease-in';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 3000);
    }

    // Show badge detail modal
    showBadgeDetail(badge) {
        const isUnlocked = this.checkBadgeUnlocked(badge);
        const badgeData = this.data.badges[badge.id];
        
        // Update modal content
        document.getElementById('badgeDetailIcon').textContent = badge.icon;
        document.getElementById('badgeDetailName').textContent = badge.name;
        document.getElementById('badgeDetailDescription').textContent = badge.description;
        
        const statusElement = document.getElementById('badgeStatus');
        const dateElement = document.getElementById('badgeDate');
        
        if (isUnlocked) {
            statusElement.textContent = '✅ Unlocked!';
            statusElement.style.color = '#27ae60';
            
            if (badgeData && badgeData.unlockedAt) {
                const unlockDate = new Date(badgeData.unlockedAt);
                dateElement.textContent = `Unlocked on ${unlockDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}`;
            } else {
                dateElement.textContent = 'Unlocked recently!';
            }
        } else {
            statusElement.textContent = '🔒 Locked';
            statusElement.style.color = '#e74c3c';
            dateElement.textContent = this.getBadgeProgress(badge);
        }
        
        // Show modal with animation
        const modal = document.getElementById('badgeModal');
        modal.style.display = 'block';
        modal.style.opacity = '0';
        
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);
    }

    // Hide badge modal
    hideBadgeModal() {
        const modal = document.getElementById('badgeModal');
        modal.style.opacity = '0';
        
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }

    // Show daily limit message
    showDailyLimitMessage() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #e74c3c, #c0392b);
            color: white;
            padding: 15px 20px;
            border-radius: 15px;
            box-shadow: 0 8px 25px rgba(231, 76, 60, 0.3);
            border: 3px solid #c0392b;
            font-weight: bold;
            z-index: 1001;
            animation: slideIn 0.5s ease-out;
        `;
        notification.textContent = '🎯 Daily limit reached! (50 points max)';
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.5s ease-in';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 3000);
    }

    // Show points adjusted message
    showPointsAdjustedMessage(requested, actual) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #f39c12, #e67e22);
            color: white;
            padding: 15px 20px;
            border-radius: 15px;
            box-shadow: 0 8px 25px rgba(243, 156, 18, 0.3);
            border: 3px solid #e67e22;
            font-weight: bold;
            z-index: 1001;
            animation: slideIn 0.5s ease-out;
        `;
        notification.textContent = `📊 Points adjusted: ${actual} instead of ${requested} (daily limit)`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.5s ease-in';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 3000);
    }

    // Check for midnight reset
    checkMidnightReset() {
        const today = this.getTodayString();
        const lastReset = this.data.lastReset;
        
        if (lastReset && lastReset !== today) {
            // New day, reset daily activities
            this.data.dailyActivities = {};
            this.data.dailyPoints = {};
            this.data.lastReset = today;
            this.saveData();
        } else if (!lastReset) {
            // First time using the app
            this.data.lastReset = today;
            this.saveData();
        }
    }

    // Update activity buttons based on completion status
    updateActivityButtons() {
        const today = this.getTodayString();
        const todayActivities = this.data.dailyActivities[today] || {};
        
        document.querySelectorAll('.activity-btn').forEach(btn => {
            const activity = btn.dataset.activity;
            const isCompleted = todayActivities[activity];
            
            if (isCompleted) {
                btn.style.opacity = '0.8';
                btn.style.filter = 'grayscale(30%)';
                btn.style.cursor = 'pointer';
                btn.title = 'Completed today! Click to see details.';
                
                // Add checkmark if not already present
                if (!btn.querySelector('.checkmark')) {
                    const checkmark = document.createElement('div');
                    checkmark.className = 'checkmark';
                    checkmark.innerHTML = '✅';
                    checkmark.style.cssText = `
                        position: absolute;
                        top: 5px;
                        right: 5px;
                        font-size: 1.2rem;
                        z-index: 10;
                    `;
                    btn.style.position = 'relative';
                    btn.appendChild(checkmark);
                }
            } else {
                btn.style.opacity = '1';
                btn.style.filter = 'grayscale(0%)';
                btn.style.cursor = 'pointer';
                btn.title = '';
                
                // Remove checkmark if present
                const existingCheckmark = btn.querySelector('.checkmark');
                if (existingCheckmark) {
                    btn.removeChild(existingCheckmark);
                }
            }
        });
    }

    // Show activity already completed message
    showActivityAlreadyCompletedMessage(activity) {
        const activityName = this.getActivityDisplayName(activity);
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #3498db, #2980b9);
            color: white;
            padding: 15px 20px;
            border-radius: 15px;
            box-shadow: 0 8px 25px rgba(52, 152, 219, 0.3);
            border: 3px solid #2980b9;
            font-weight: bold;
            z-index: 1001;
            animation: slideIn 0.5s ease-out;
        `;
        notification.textContent = `✅ ${activityName} already completed today!`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.5s ease-in';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 3000);
    }

    // Get activity display name
    getActivityDisplayName(activity) {
        const activityNames = {
            'brush-teeth-morning': 'Brush Teeth (Morning)',
            'brush-teeth-evening': 'Brush Teeth (Evening)',
            'breakfast': 'Breakfast',
            'lunch': 'Lunch',
            'dinner': 'Dinner',
            'drink-milk': 'Drink Milk',
            'use-restroom': 'Use Restroom',
            'piano-practice': 'Piano Practice',
            'reading-10min': 'Reading (10 min)',
            'maths-10min': 'Maths (10 min)',
            'spanish': 'Spanish',
            'soccer': 'Soccer',
            'baseball': 'Baseball',
            'swimming': 'Swimming',
            'clean-room': 'Clean Room',
            'play-nicely-sister': 'Play Nicely with Sister',
            'good-behavior': 'Good Behavior'
        };
        
        return activityNames[activity] || activity;
    }

    // Get activity ID from display name
    getActivityIdFromName(activityName) {
        const activityMap = {
            'Brush Teeth (Morning)': 'brush-teeth-morning',
            'Brush Teeth (Evening)': 'brush-teeth-evening',
            'Breakfast': 'breakfast',
            'Lunch': 'lunch',
            'Dinner': 'dinner',
            'Drink Milk': 'drink-milk',
            'Use Restroom': 'use-restroom',
            'Piano Practice': 'piano-practice',
            'Reading (10 min)': 'reading-10min',
            'Maths (10 min)': 'maths-10min',
            'Spanish': 'spanish',
            'Soccer': 'soccer',
            'Baseball': 'baseball',
            'Swimming': 'swimming',
            'Clean Room': 'clean-room',
            'Play Nicely with Sister': 'play-nicely-sister',
            'Good Behavior': 'good-behavior'
        };
        
        // Remove emojis and trim for matching
        const cleanName = activityName.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
        
        return activityMap[cleanName] || null;
    }

    // Show activity completion info
    showActivityCompletionInfo(activity) {
        const activityName = this.getActivityDisplayName(activity);
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #27ae60, #2ecc71);
            color: white;
            padding: 15px 20px;
            border-radius: 15px;
            box-shadow: 0 8px 25px rgba(39, 174, 96, 0.3);
            border: 3px solid #27ae60;
            font-weight: bold;
            z-index: 1001;
            animation: slideIn 0.5s ease-out;
        `;
        notification.textContent = `✅ ${activityName} completed today!`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.5s ease-in';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 2000);
    }

    // Load settings
    loadSettings() {
        const kidNameInput = document.getElementById('kidName');
        const startingPointsInput = document.getElementById('startingPoints');
        const dailyLimitInput = document.getElementById('dailyLimit');
        
        kidNameInput.value = this.data.settings.kidName || 'Vir';
        startingPointsInput.value = this.data.settings.startingPoints || 0;
        dailyLimitInput.value = this.data.settings.dailyLimit || 50;
    }

    // Show settings modal
    showSettingsModal() {
        console.log('Showing settings modal');
        this.loadSettings();
        const modal = document.getElementById('settingsModal');
        console.log('Modal element:', modal);
        
        if (!modal) {
            console.error('Settings modal not found!');
            return;
        }
        
        modal.style.display = 'block';
        modal.style.opacity = '0';
        
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);
    }

    // Hide settings modal
    hideSettingsModal() {
        const modal = document.getElementById('settingsModal');
        modal.style.opacity = '0';
        
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }

    // Save settings
    saveSettings() {
        const kidName = document.getElementById('kidName').value.trim();
        const startingPoints = parseInt(document.getElementById('startingPoints').value) || 0;
        const dailyLimit = parseInt(document.getElementById('dailyLimit').value) || 50;
        
        // Update settings
        this.data.settings.kidName = kidName || 'Vir';
        this.data.settings.startingPoints = startingPoints;
        this.data.settings.dailyLimit = dailyLimit;
        
        // Apply starting points if this is the first time
        if (this.data.totalPoints === 0 && startingPoints > 0) {
            this.data.totalPoints = startingPoints;
        }
        
        this.saveData();
        this.updateDisplay();
        this.updateProgressBars();
        this.hideSettingsModal();
        
        // Show success message
        this.showSettingsSavedMessage();
    }

    // Show settings saved message
    showSettingsSavedMessage() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #27ae60, #2ecc71);
            color: white;
            padding: 15px 20px;
            border-radius: 15px;
            box-shadow: 0 8px 25px rgba(39, 174, 96, 0.3);
            border: 3px solid #27ae60;
            font-weight: bold;
            z-index: 1001;
            animation: slideIn 0.5s ease-out;
        `;
        notification.textContent = '✅ Settings saved successfully!';
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.5s ease-in';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 2000);
    }

    // Undo activity
    undoActivity(index) {
        if (index < 0 || index >= this.data.activities.length) {
            return;
        }
        
        const activity = this.data.activities[index];
        const points = activity.points;
        const activityName = activity.activity;
        
        // Remove points from total
        this.data.totalPoints -= points;
        
        // Remove points from daily total
        const today = this.getTodayString();
        if (this.data.dailyPoints[today]) {
            this.data.dailyPoints[today] -= points;
            if (this.data.dailyPoints[today] < 0) {
                this.data.dailyPoints[today] = 0;
            }
        }
        
        // Remove from activities list
        this.data.activities.splice(index, 1);
        
        // Decrease activity count for badges
        if (this.data.activityCounts[activityName]) {
            this.data.activityCounts[activityName]--;
            if (this.data.activityCounts[activityName] < 0) {
                this.data.activityCounts[activityName] = 0;
            }
        }
        
        // Unmark activity as completed for today (if it was a daily activity)
        const todayActivities = this.data.dailyActivities[today] || {};
        
        // Find the activity ID that matches this activity name
        const activityButtons = document.querySelectorAll('.activity-btn');
        for (let btn of activityButtons) {
            const buttonText = btn.textContent.trim();
            // Match by exact text or by activity ID
            if (buttonText === activityName || btn.dataset.activity === this.getActivityIdFromName(activityName)) {
                const activityId = btn.dataset.activity;
                if (todayActivities[activityId]) {
                    delete todayActivities[activityId];
                }
                break;
            }
        }
        
        // Save and update display
        this.saveData();
        this.updateDisplay();
        this.updateProgressBars();
        this.updateChart();
        this.updateBadges();
        this.updateActivityButtons();
        this.updateActivityList();
        
        // Show undo confirmation
        this.showUndoConfirmation(activityName, points);
    }

    // Show undo confirmation
    showUndoConfirmation(activityName, points) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #e74c3c, #c0392b);
            color: white;
            padding: 15px 20px;
            border-radius: 15px;
            box-shadow: 0 8px 25px rgba(231, 76, 60, 0.3);
            border: 3px solid #e74c3c;
            font-weight: bold;
            z-index: 1001;
            animation: slideIn 0.5s ease-out;
        `;
        notification.textContent = `↶ Undid ${activityName} (-${points} points)`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.5s ease-in';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 2000);
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
    window.rewardTracker = new RewardPointsTracker();
});
