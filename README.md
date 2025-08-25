# 🎉 Kid's Reward Points Tracker

A fun, mobile-friendly web app to track your child's reward points for good behavior and activities!

## Features

- **🎯 Easy Point Adding**: Quick buttons for common point values (+1, +5, +10, +25)
- **📊 Visual Progress**: See total and daily points with animated progress bars
- **📈 Progress Chart**: Beautiful line chart showing the last 7 days of activity
- **🎨 Kid-Friendly Activities**: Pre-configured activities with fun emojis:
  - **Daily Routines**: Brush teeth, meals, drink milk
  - **Learning Time**: Piano practice, reading, maths, Spanish
  - **Sports & Exercise**: Soccer, baseball, swimming
  - **Chores & Behavior**: Clean room, play nicely with sister, good behavior
- **📱 Mobile-First Design**: Works perfectly on phones and tablets
- **💾 Local Storage**: Data saved automatically in the browser
- **🎭 Fun Animations**: Bouncing effects and floating point indicators
- **🔄 Reset Function**: Easy way to start fresh (with confirmation)

## Point Values

| Activity | Points |
|----------|--------|
| Brush Teeth | 3 |
| Meals (Breakfast/Lunch/Dinner) | 5 |
| Drink Milk | 2 |
| Piano Practice | 10 |
| Reading (10 min) | 8 |
| Maths (10 min) | 8 |
| Spanish | 6 |
| Soccer/Baseball | 12 |
| Swimming | 15 |
| Clean Room | 8 |
| Play Nicely with Sister | 5 |
| Good Behavior | 3 |

## Deployment to Vercel

1. **Push to GitHub**: Upload your code to a GitHub repository
2. **Connect to Vercel**: 
   - Go to [vercel.com](https://vercel.com)
   - Sign up/login with your GitHub account
   - Click "New Project"
   - Import your repository
3. **Deploy**: Vercel will automatically detect it's a static site and deploy it
4. **Access**: Your app will be available at `https://your-project-name.vercel.app`

## Local Development

1. Clone the repository
2. Open `index.html` in your browser
3. Start tracking points!

## Customization

### Adding New Activities
Edit the HTML file and add new activity buttons in the appropriate category:

```html
<button class="activity-btn" data-activity="new-activity" data-points="10">
    🎮 New Activity
</button>
```

### Changing Point Values
Modify the `data-points` attribute on any activity button.

### Changing Colors
Edit the CSS variables in `styles.css` to match your child's favorite colors!

## Data Storage

All data is stored locally in the browser using localStorage. This means:
- ✅ No server costs
- ✅ Works offline
- ✅ Data persists between sessions
- ❌ Data is device-specific (won't sync across devices)

## Browser Compatibility

Works on all modern browsers:
- Chrome/Edge
- Firefox
- Safari
- Mobile browsers

## Future Enhancements

- [ ] Cloud storage for multi-device sync
- [ ] Achievement badges
- [ ] Goal setting and rewards
- [ ] Family sharing
- [ ] Export data to PDF
- [ ] Custom activity creation

---

Made with ❤️ for encouraging good behavior and learning!
# reward-points
