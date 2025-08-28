# Zipcode Suggestions - Quick Start Guide

## 🚀 How to Use Zipcode Suggestions

### Step 1: Select Zipcode Mode
1. Click on any input field for start or finish location
2. Select the **"Zipcode"** radio button option
3. The input field will now show "Enter zip code"

### Step 2: Get Suggestions  
1. Type at least 3 characters of a zipcode (e.g., `400`)
2. **Press ENTER** - this is the key trigger!
3. A dropdown will appear with suggestions in format: **ZIP + Street + County**

### Step 3: Select Your Choice
- **Click** on any suggestion to select it
- Or use **Arrow Keys** (↑↓) to navigate and **Enter** to select
- Press **Escape** to close the dropdown

### Step 4: Multiple Destinations (For Finish Zipcodes)
1. After selecting your first zipcode, the input will clear
2. Type another zipcode and press ENTER again
3. Select another suggestion - it will be added to a stacked list
4. Remove any selection by clicking the **×** button next to it

## 📍 Example Zipcodes to Try

| Zipcode | Area | Expected Results |
|---------|------|------------------|
| `400253` | Cluj-Napoca | Strada Doinei area |
| `400656` | Cluj-Napoca | Strada Câmpului area |
| `405100` | Câmpia Turzii | Administrative center |
| `407035` | Apahida | Rural area near Cluj |
| `400335` | Cluj-Napoca | Zorilor district |

## 🎯 Pro Tips

### Search Features
- **Exact Match**: Type the full zipcode for exact matches
- **Partial Search**: Type beginning characters (e.g., "4002" for all 4002xx zipcodes)  
- **City Search**: Type city names (e.g., "Cluj" or "Apahida")
- **Smart Ranking**: Most relevant results appear first

### Keyboard Shortcuts
- **ENTER**: Show suggestions / Select highlighted suggestion
- **↑ / ↓**: Navigate through suggestions
- **ESC**: Close suggestions dropdown
- **TAB**: Move to next field

### Visual Indicators
- Placeholder text changes as you type:
  - `"Enter zip code"` → `"Type 2 more characters..."` → `"Press ENTER for suggestions"`
- Selected zipcodes appear as blue pills with remove buttons
- Active suggestion is highlighted in the dropdown

## 🔄 Integration with Routing

### Multiple Destinations Mode
```
Start: 400656
Finish: 400253, 405100, 407035
Result: Routes from 400656 to each destination
```

### Round Trip Mode  
```
Start: 400656
Waypoints: 400253, 405100, 407035
Result: 400656 → 400253 → 405100 → 407035 → 400656
```

## ❗ Troubleshooting

### No Suggestions Appearing?
- ✅ Make sure you selected "Zipcode" option
- ✅ Type at least 3 characters
- ✅ **Press ENTER** (this is required!)
- ✅ Check browser console for errors

### Suggestions Not Loading?
- 🔄 Wait a few seconds for data to load on first page visit
- 🌐 Check internet connection
- 📋 Try refreshing the page

### Multiple Selection Not Working?
- 📍 Only works for "finish" zipcode fields
- 🎯 Make sure you're in the correct input field
- ➕ Select one zipcode at a time

## 🎮 Try the Demo

Visit the interactive demo page: **`/zipcode_suggestions_demo.html`**

The demo includes:
- Live suggestions testing
- Multiple selection examples  
- Real-time status monitoring
- All features in a controlled environment

---

**Need Help?** Check the full documentation in `docs/ZIPCODE_SUGGESTIONS_FEATURE.md` or contact the development team.


<div align="center">

---
### Developed by **Rajat Saini**
---

</div>
