### Defensive Rebounding Percentage ###
Formula: 100*(Defensive Rebounds*(Team Minutes/5)) / (Minute played*(Team Defensive Rebounds + Opponent's Offensive Rebounds))
// OU 100 - offensiveReboundPct ?

### Offensive Rebounding Percentage ###
Formula: API (offensiveReboundPct)

### Points Per Shot ###
Formula: (Total Points off of 2PA and 3PA) / (Total FGA)

### Points Per Possesion ###
Formula: (Total Points / ((FGA + 0.44)*(FTA + Turnovers)))

### 2 Points ###
Formula: (Total Points off of 2PA) / (Total 2PA)

### 3 Points ###
Formula: (Total Points off of 3PA) / (Total 3PA)

### Free Throws Rate ###
Formula: API (freeThrowRate)

### Usage % ###
Formula: API (usage)

### Assist % ###
Formula: 100*assists/(((Minutes Played/(Team Minutes/5))*Team Field Goals Made) - Field Goals Made)

### Ball Security (Turnover % ?) ###
Formula: ((Turnovers)*100)/((FGA)+(FTA*0.44)+(assists)+(Turnovers))

### Block % ###
Formula: 100*(Blocks*(Team Minutes/5)) / (Minute played*(Opponent's FGA - Opponent's 3 points attemps))

### Steal % ###
Formula: 100*(Steals*(Team Minutes/5)) / (Minute played*(Opponent's Possessions))

### True Shooting % ###
Formula: API (trueShootingPct)

### Offensive Rating ###
Formula: API (offensiveRating)

### Defensive Rating ###
Formula: API (defensiveRating)

### Turnover Rate ###
Formula: 100*Turnovers/(FGA*0.44+FTA+Turnovers)

### Defensive BPM ###
Formula: set later (https://www.basketball-reference.com/about/bpm2.html)

### Offensive BPM ###
Formula: set later (https://www.basketball-reference.com/about/bpm2.html)

### BPM ###
Formula: OBPM + DBPM

### Steals / 40mn ###
Formula: (Steals * 40) / Minutes Played

### Blocks / 40mn ###
Formula: (Blocks * 40) / Minutes Played

### Plus/Minus / 40mn ###
Formula: (BPM * 40) / Minutes Played

### netRating ###
Formula: API (netRating)

### Offensive vs Defensive Rating Differential ###
Formula: API (offensiveRating) - API (defensiveRating)

### Deflection / 40mn ###
Formula: Scrapping ?

### Total rebounds / 40mn ###
Formula: (Rebounds * 40) / Minutes Played

### Fouls / 40mn ###
Formula: (Fouls * 40) / Minutes Played

### Played minute % ###
Formula: Minutes / (team games * 40)

### Height Weight Span ###
Formula: compare height and weight ans span with other players

### AST/TO Ratio ###
Formula: Assists / Turnovers

### FT % ###
Formula: API (freefreeThrows.pct)

### 3PA ratio ###
Formula: 3PA / FGA

### Fouls rate (fouls per minute ?) ###
Formula: Fouls / Minutes Played

### % created possessions ###
Formula: scrapping ?

### Iso / Création autonome ###
Formula: scrapping ?

### % transition play ###
Formula: scrapping ?

### PPP Transition ###
Formula: scrapping ?

### Team Tempo ###
Formula: scrapping ?

### Spot-up / Catch&shoot ###
Formula: scrapping ?
