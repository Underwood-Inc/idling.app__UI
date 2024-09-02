# Changelog

### build

- add github action that manager version control on commits (#154)
- add release-it easier release cuts and changelog gen
- add sonarcloud setup and config (#144)
- add vscode setting for sonarlint connection when using the sonarlint extension
- increase specificity of scanned files for sonarcloud analysis
- rename docker postgres init files (#149)
- use release-please github action (#164)
- v0.17.11 - dep update + doc badge (#153)
- v0.17.5 - add custom lint rule to warn about usage of nextjs Link with external href (#148)

### Documentation

- add sonarcloud badges (#146)

### Tests

- add component tests for avatar (#151)
- add component tests for AvatarsBackground component (#152)
- add component tests for badge.tsx (#155)
- add component tests for card.tsx (#156)
- add component tests for coin.tsx (#157)
- add component tests for fancyborder (#162)
- add component tests for filterlabel and filterbar (#163)
- add component tests for footer (#165)
- add discord embed component tests (#158)
- add discordlink.tsx component tests (#159)
- add empty component tests (#160)
- add fadein component tests (#161)
- add tests for auth buttons
- include coverage reports for accurate sonarcloud analysis
- v0.17.7 - add component tests for appversion.tsx (#150)

# Changelog

### Bug Fixes

- add fix for aside on small screens (#79)
- add fix for duplicate keys on tag link component
- bug where page meta updates were missing on changing the page size
- build deployment if there are files present (#123)
- fix uppercase tag click

### build

- auto deploy script for new code merged into master (#113)
- bump version
- bump version
- bump version
- normalize env variables (#108)
- remove unused dependancy
- update db seed script to use random dates within last five years for submissions (#128)
- update deploy action
- update deploy action
- update deploy action
- update deploy action
- update deploy action
- update deploy action
- update deploy action
- update deploy action
- update deploy action
- update deploy action
- update deploy action
- update deploy action
- update deploy action
- update deploy action
- update deploy action
- update deploy action
- update deploy action
- update deploy action
- update deploy action
- update deploy action
- update deploy action
- update deploy action
- update deploy action
- update deploy action
- update deploy action
- update deploy action (#116)
- update deploy action (#119)
- use yarn in github action

### Chores

- add logger to debug prod-only issue (#88)

### doc

- add pull request template
- move pull request template to proper directory

### Documentation

- add some documentation around the more complex postgresql queries being performed (#107)
- add todo (#143)

### Features

- add about and remove game (#53)
- add avatar background
- add blurb about bug reporting
- add clear all button for filters (#104)
- add discord activity channel widget (#110)
- add discord embed to main page (#54)
- add filter removal ability (#91)
- add google auth provider to nextauth (#74)
- add home icon generation using twitch username as seed (#66)
- add improvements to /posts (#71)
- add jest testing setup and sample test (#80)
- add message ticker (#124)
- add noStore to prevent postgres response caching (#59)
- add pagination (#83)
- add punctuation stripping to tags
- add sorting to recent tags in date desc order (#82)
- add submission validation enhancements (#70)
- add support for future feature that will add recent tag interval selections (#81)
- add support for google login usernames to coin faces (#75)
- add used character count for submission name and code types dec… (#63)
- add wip recent tags component (#78)
- fix favicons (#50)
- fix typo in about component (#112)
- move filterbar below new post form for optimal UX regardless of viewport width
- move to nextjs and add demo of html5 build of a GameMaker Studio export (#49)
- restore discord widget embed to aside on main page (#103)
- sort recent tags by date desc
- store only lowercase tags
- update discord channel widget data (#121)
- v0.11.6 - update submission_name to post (#122)
- v0.13.0 - add /my-posts route (#130)
- v0.14.5 - disable prefetch of tag links (#137)
- v0.15.0 - add pagination page selector (#140)
- v0.16.0 - add page size selector (#141)
- v0.17.0 - url pagination support (#142)
- v0.17.1 - restore page size selector
- v0.17.3 - remove callback support on pagination
- v0.17.4 - url navigation now hooked into new url pagination + filters

### Refactors

- revert select due to it returning duplicate tags in recents

### Styles

- add a color palatte and update several components to use it (#69)
- add better mobile device support with hover event styles
- add pagination style improvements (#84)
- adjust colors to be WCAG contrast compliant (#98)
- adjust to better leverage available viewport space (#126)
- align pagination page info center vertically
- better infinite message scrolling animation (#125)
- enhance the UX (#61)
- enhance vertical responsiveness of the aside section (#95)
- ensure post content does not overlap the post datetime (#135)
- fix scrolling when aside has an iframe inside (#106)
- improve responsiveness of filterbar component
- improve the responsiveness of the posts page (#101)
- remove extra space below discord iframe (#120)
- remove filter badge not shown until hover action
- revamp filter badge appearance to align better with app color palatte
- v0.12.5 - cursor pointer on tag remove badge only (#129)
- v0.13.1 - better aside scrolling (#131)
- v0.14.0 - fade render (#132)
- v0.14.1 - cleanup css (#133)
- v0.14.6 - use page container for auth api route page (#138)
- v0.14.7 - flexy tags (#139)

### Tests

- add playwright (#94)
- add tests for about page, discord link, and gitlab link (#92)
- add tests for wcag and fake auth required for testing protected route (#100)
- fix about page test
