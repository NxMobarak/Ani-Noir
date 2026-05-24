# Shadow Quiz Character Images

Place your 250 anime character images here.

## Naming Convention:
- Level 1: `l1_1.jpg`, `l1_2.jpg`, ... `l1_50.jpg`
- Level 2: `l2_1.jpg`, `l2_2.jpg`, ... `l2_50.jpg`
- Level 3: `l3_1.jpg`, `l3_2.jpg`, ... `l3_50.jpg`
- Level 4: `l4_1.jpg`, `l4_2.jpg`, ... `l4_50.jpg`
- Level 5: `l5_1.jpg`, `l5_2.jpg`, ... `l5_50.jpg`

## How to switch to local images:
In each `src/questions/levelX_shadow.js` file, change the image field from:
```
image: "https://api.jikan.moe/v4/characters/XXXX"
```
to:
```
image: "/shadows/lX_Y.jpg"
```

The app uses CSS `filter: brightness(0)` to make the image appear as a black silhouette.
When the user answers, the filter is removed and the real image is revealed.

## Image Requirements:
- Format: JPG or PNG
- Recommended size: 225x350px (portrait)
- Clear character face/body shot works best
