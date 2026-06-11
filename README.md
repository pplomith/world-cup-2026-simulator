# World Cup 2026 Scenario Engine

World Cup 2026 Scenario Engine is an interactive simulator of the 2026 FIFA World Cup

It generates a complete tournament history, from the group stage to the
World Cup final, respecting the structure required for the 48-team format:

- 12 groups of four teams;
- Top two teams qualify;
- Eight best third-place teams qualify;
- Round of 32;
- Round of 16;
- Quarterfinals;
- Semifinals;
- Third-place match;
- World Cup final.

GO TO SIMULATE: https://pplomith.github.io/world-cup-2026-simulator/ 
## Objective

The objective of the project is to realistically represent the different scenarios
that could occur during the 2026 World Cup.

The simulator does not attempt to predict who will win the tournament. Each
simulation represents one of many possible futures: the strongest national teams
have a greater chance of advancing, but draws,
surprises, unexpected eliminations, and high-goal results remain possible.

## What it allows you to do

The web app allows you to:

- consult the pre-tournament odds for all 48 national teams;
- view the odds of finishing first, second, third,
or fourth in the group;
- know the chances of reaching each stage of the tournament;
- generate a new, complete simulation of the 104 matches;
- follow the group standings and the best third-place teams;
- explore the official draw until the final;
- view the results, odds, and expected goals for each match;
- repeat a scenario using a seed;
- use the interface in Italian or English.

## Where the predictions come from

The simulator is based on a football analysis and forecasting pipeline built
using historical data and aggregated information on national teams.

The system considers several aspects of a team's strength, including:

- recent international results;
- offensive and defensive performance;
- recent match form;
- FIFA ranking;
- Elo rating;
- overall squad strength and value;
- player international experience;
- performance in major competitions;
- quality of the available departments and lineup;
- average level of opponents faced;
- experience in knockout matches;
- penalty shootout performance;
- match, schedule, and neutral venue characteristics.

This information is processed by a combination of statistical and machine learning models.
The result is an estimate of expected goals and the probabilities of
a win, draw, and defeat for each possible match in the tournament.

The outcome distributions are then calibrated to produce
realistic scores, including both frequent outcomes such as 1-0, 1-1, and 2-0,
as well as less common events such as 0-0, 3-1, 4-0, or matches with many goals.

## Model Architecture

The prediction does not depend on a single algorithm. An ensemble
of three families of models is used, trained separately to estimate the expected goals
of the two teams:

| Model | Role | Current Weight |
| --- | --- | ---: |
| Ridge with logarithmic transformation | Produces a regularized and stable estimate of goals | 37.50% |
| Poisson Regression | Directly models counting events such as goals | 31.25% |
| Histogram Gradient Boosting with Poisson loss | Captures nonlinear relationships and interactions between features | 31.25% |

The weights do not indicate the probability that a model is correct. They are used to
combine the three estimates of expected goals. The configuration is selected
by comparing alternatives on the validation data, considering both
overall performance and matches between top-level national teams.

The LightGBM model was considered among the possible candidates in the
pipeline, but is not part of the ensemble currently used for the
published probabilities.

## National Team Form and Strength

Recent form uses a two-level structure:

- the last 20 matches constitute the most stable base;

- the last 5 matches represent the recent momentum component.

This prevents a single win or loss from excessively altering the
estimate, without ignoring more recent changes.

The characteristics are also summarized into indicators of relative
strength. The forecast considers the differences between the two national teams, not
just their absolute values.

For matches on neutral ground, the forecast is also calculated by reversing
the order of the teams. The two estimates are then made symmetric, reducing
any artificial advantages caused by the position of Team A or Team
B in the data.

## Calibration of Results

Once the expected goals are obtained, the system constructs a complete distribution
of possible scores from 0-0 to 10-10.

The current configuration uses:

| Parameter | Value | Meaning |
| --- | ---: | --- |
| Distribution of Goals | Negative Binomial | Allows for greater variability than a pure Poisson |
| Dispersion | 50 | Introduces moderate additional volatility in the scores |
| Dixon-Coles `rho` | -0.10 | Corrects for the frequency of outcomes with few goals |
| Calibration Temperature | 1.00 | Maintains the distribution without further compression or amplification |

The Negative Binomial allows the most frequent outcomes to be retained, but
also assigns credible probabilities to 0-0, 3-1, 4-0, and other less
ordinary matches.

The Dixon-Coles correction primarily affects 0-0, 1-0, 0-1, and 1-1 scores, which
in soccer are not always correctly represented, assuming that the goals
of the two teams are completely independent.

## Corrections for Specific Matches

The model applies additional controls in two situations:

- matches between national teams considered to be of a high level;
- matches with a particularly large gap in strength.

For both categories, a 25% blend is used between the estimate produced
by the models and an independent indicator of relative strength. In matches with a
large gap, the correction scale is equal to 1.25.

These adjustments serve to reduce two possible biases:

- a favorite that is too dominant solely due to ranking or rating effects;
- a significantly inferior national team treated as almost equal to the
favorite.

The correction primarily modifies the distribution of expected goals between the two
teams, keeping the total expected number of goals under control.

## The 100,000 Monte Carlo Simulations

The tournament was simulated 100,000 times to create the probabilities displayed
in the web app.

Each run simulates:

1. All group stage matches;
2. The final standings of the 12 groups;
3. The selection of the eight best third-place teams;
4. The composition of the Round of 32;
5. All knockout matches;
6. The third-place play-off;
7. The World Cup final.

The results of the 100,000 simulations allow us to calculate, for each
national team:

- probability of finishing in each group position;
- probability of qualifying for the Round of 32;
- probability of reaching the round of 16, quarterfinals, and semifinals;
- probability of reaching the final;
- probability of winning the World Cup.

These percentages represent the overall tournament rating and
are displayed before starting a new simulation.

The emulations do not only use the probability of becoming champion.
To construct a more stable measure of the overall performance, various probabilities are
considered, with the following weights:

| Monte Carlo Indicator | Weight in the prior |
| --- | ---: |
| Winning the World Cup | 36% |
| Reaching the final | 22% |
| Reaching the semifinals | 17% |
| Reaching the quarterfinals | 13% |
| Reaching the round of 16 | 8% |
| Qualifying for the Round of 32 | 4% |

The probabilities are transformed and standardized before being combined.

This way, the prior does not depend solely on the final probability of
winning, which for many national teams is necessarily very low.

## How a single simulation is generated

When the simulation button is pressed, an existing tournament is not chosen from the 100,000 previous ones.

Instead, a new story is generated, match by match.

For each match:

1. The calibrated probabilities of the two national teams are retrieved;
2. The result is extracted from the distribution of possible scores;
3. Points, goals scored, and goals conceded are updated;
4. The teams are sorted in the group standings;
5. The teams that qualify and the best third-place finishers are determined;
6. The draw is drawn according to the established rules;
7. Knockout matches are simulated up to the final;
8. In the event of a draw, the outcome of the penalty shootout is also simulated.

The probabilities obtained from the 100,000 simulations are used as a
moderate indication of the overall strength of the national teams, with a weight of
20% in the individual simulation.

The remaining behavior derives from the calibrated distribution of the individual
match. The 20% distribution does not mean that the outcome is decided by a fifth
early: it moderately changes the distribution of possible scores,
favoring a direction consistent with the pattern observed in the 100,000
emulations.

In this way, each new simulation remains random, but continues to reflect
the estimated differences between the teams. A surprise remains possible, while a
very unlikely sequence of surprises becomes less frequent.

1,200 distributions are used for the tournament:

- 72 distributions for the already-determined group stage matches;
- 1,128 distributions for all possible pairings among the 48 national teams.

Each distribution contains the probability of all the scores considered,
not just the 1X2 probability or the most likely outcome.

By inserting a seed, the same scenario can be reproduced again.

## Standings, Top Third-Place Teams, and Penalties

During the group stage, points, goals scored, goals conceded, and
goal difference are updated. The standings are sorted using:

1. points;
2. goal difference;
3. goals scored;
4. a random final tie-break when the available values ​​are identical.

The third-place teams are compared using the same indicators, and the top
eight advance to the Round of 32. They are then assigned to the
compatible slots in the bracket.

In a knockout match, a draw in regulation time leads
to a penalty shootout. The probability is not always 50-50: consider
indicators such as historical series performance, penalty taker quality, goalkeeper
rating, overall strength, and expected match balance.

## How to Interpret the Results

A high probability does not guarantee that a team will win, just as a
low probability does not make an upset impossible.

For example, a national team with a 15% chance of winning the tournament remains
the favorite over many opponents, but in most
simulations it will not become champion.

The individual simulation should therefore be read as a possible narrative
of the World Cup, while the aggregate percentages describe the overall trend
of the model.

## Forecast Updates

Probabilities may change when the following are updated:

- international results;
- FIFA and Elo rankings;
- recent form;
- call-ups and squads;
- injuries and suspensions;
- schedule and final group composition.

The project is for informational, experimental, and entertainment purposes. It is not intended for betting or financial decisions.
