##### call api #####
API_BASE_URL: https://api.collegebasketballdata.com
BEARER_TOKEN=6wCxNYWKvTdzSM/x7m1cds30QeUgMhkR3yNiShFAYVqCXxkt3F8thEYqxZSzKNQv

##### get team stats (to compare with the player's impact in the team and for description) #####
https://api.collegebasketballdata.com/stats/team/season?season=2026&team=BYU

##### get team shooting stats (let's if we need it) #####
https://api.collegebasketballdata.com/stats/team/shooting/season?season=2026&team=BYU

##### get team player stats () #####
https://api.collegebasketballdata.com/stats/player/season?season=2026&team=BYU

##### get team players shooting stats #####
https://api.collegebasketballdata.com/stats/player/shooting/season?season=2026&team=BYU

##### get player list shooting details (to get real court datas) #####
https://api.collegebasketballdata.com/plays/player/198382?season=2026&shootingPlaysOnly=true

##### example doc ######
Usage
Authorization
To authorize requests, use the setConfig method to set the Authorization header using your personal API key. API keys can be acquired from the CollegeBasketballData.com website.

import { client } from 'cbbd';

client.setConfig({
    headers: {
        'Authorization': 'Bearer YOUR_API_KEY',
    }
});
Example Usage
All API operations can be imported from the cbbd package and used as shown below.

import { client, getGames } from 'cbbd';

// Set up the client with your API key
client.setConfig({
    headers: {
        'Authorization': 'Bearer YOUR_API_KEY',
    }
});

// Call the getGames endpoint
const games = await getGames({
    query: {
        season: 2025,
    },
});

for (const game of games.data ?? []) {
    // Do something with the game data
    // For example:
    console.log(`${game.awayTeam} vs ${game.homeTeam} - ${game.excitement}`);
}
