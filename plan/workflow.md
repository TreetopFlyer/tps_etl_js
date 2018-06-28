
## general workflow overview
* initial setup
    1. create a source
    2. run import
    3. setup regex
    4. map all regex
* on-going usage
    1. run import
    2. address any new unmapped items

## source maintenance

```
+-------------------------------------------------------------------------------------------------+
|  +-------------+                                                                                |
|  |MAKE NEW     |                                                                                |
|  +-------------+                                                                                |
|                                                                                                 |
|  existing sources         source name                                                           |
|  +--------------+         +---------------+                                                     |
|  |dcard         |         |dcard          |                                                     |
|  |hunt          |         +---------------+                                                     |
|  |pncc          |         data source                                                           |
|  |paycom        |         +---------------+                                                     |
|  |adp           |         |client file    |  enum based on api functions                        |
|  |              |         +---------------+                                                     |
|  |              |         loading function                                                      |
|  |              |         +---------------+                                                     |
|  |              |         |cs^ parser     |  enum based on api functions                        |
|  |              |         +---------------+                                                     |
|  |              |         schema                                                                |
|  |              |         +----------------+ +------------+                                     |
|  |              |         |default         | |b: add new  |                                     |
|  |              |         +----------------+ +------------+                                     |
|  |              |         +------------------------------------------------------------+        |
|  |              |         |path           |data type        |column name      |constrai|        |
|  |              |         +------------------------------------------------------------+        |
|  |              |         |{Post. Date}   |date             |post_date        |X       |delete  |
|  |              |         |{Amount}       |numeric          |amount           |X       |delete  |
|  |              |         |{Trans. Date}  |date             |trans_date       |X       |delete  |
|  |              |         |{Category}     |text             |category         |        |delete  |
|  |              |         |{Description}  |text             |descr            |        |delete  |
|  |              |         |               |                 |                 |        |add     |
|  +--------------+         +------------------------------------------------------------+        |
|                                                                                                 |
|                                                                                                 |
|                                                                                                 |
|                                                                                                 |
+-------------------------------------------------------------------------------------------------+
||Trans. Date|Post Date|Description                                   |Amount|Category        |   |
|---------------------------------------------------------------------------------------------+   |
||1/2/2018   |1/2/2018 |GOOGLE *YOUTUBE VIDEOS G.CO/HELPPAY#CAP0H07TXV|4.26  |Services        |   |
||1/2/2018   |1/2/2018 |MICROSOFT *ONEDRIVE 800-642-7676 WA           |4.26  |Services        |   |
||1/3/2018   |1/3/2018 |CLE CLINIC PT PMTS 216-445-6249 OHAK2C57F2F0B3|200   |Medical Services|   |
+|1/4/2018   +1/4/2018 +AT&T *PAYMENT 800-288-2020 TX                 +57.14 +Services        |   |
|                                                                                                 |
+-------------------------------------------------------------------------------------------------+
```
## regex maintenance

```
+-------------------------------------------------------------------------------------------------------------------------------------+
|                                                                                                                                     |
|                                                                                                                                     |
|                                                 filter - only apply to where these top level keys exist                             |
|  sources                  name                                                                                                      |
|  +---------------+        +--------------+      +----------------------+----------------------+                                     |
|  |dcard          |        |First 20      |      |top level key         | value                |                                     |
|  |hunt           |        +--------------+      +---------------------------------------------+                                     |
|  |pncc           |        source                |key-name              |certain value         |                                     |
|  |pnco           |        +--------------+      |                      |                      |                                     |
|  |pncl           |        |dcard         |      |                      |                      |                                     |
|  |paycom         |        +--------------+      |                      |                      |                                     |
|  |adp            |        sequence              |                      |                      |                                     |
|  |               |        +--------------+      +----------------------+----------------------+                                     |
|  +---------------+        |1             |                                                                                          |
|  targets                  +--------------+                                                                                          |
|  +---------------+        function                                                                                                  |
|  |check number|1 |        +--------------+                                                                                          |
|  |strip commas|2 |        |extract       | enum extract, replace                                                                    |
|  |trans type  |3 |        +--------------+                                                                                          |
|  |currency    |4 |                                                                                                                  |
|  |parse ach   |5 |        +-----------------------------------+---------+-----------------------------------------------+           |
|  |            |  |        |key           |map |fl|re|replace  |  newkey |                                               |           |
|  |            |  |        +---------------------------------------------------------------------------------------------+           |
|  |            |  |        |{Description} |y   |  |y |         | f20     |.{1,20}                                        |delete     |
|  |            |  |        |              |    |  |  |         |         |                                               |add        |
|  |            |  |        |              |    |  |  |         |         |                                               |           |
|  |            |  |        |              |    |  |  |         |         |                                               |           |
|  |            |  |        +--------------+----+--+--+---------+---------+-----------------------------------------------+           |
|  +------------+--+                                                                                                                  |
|                           +-------------------------------------------------------------------------------------+                   |
|                           |map     |return value                   |party             |reason       |add column |                   |
|                           +-------------------------------------------------------------------------------------+                   |
|                           |First 20|{"f20": "DISCOUNT DRUG MART 3"}|Discount Drug Mart|groceries    |           |                   |
|                           |First 20|{"f20": "TARGET STOW OH"}      |Target            |groceries    |           |                   |
|                           |First 20|{"f20": "WALMART GROCERY 800-"}|Walmart           |groceries    |           |                   |
|                           |First 20|{"f20": "CIRCLE K 05416 STOW "}|Circle K          |gasoline     |           |                   |
|                           |First 20|{"f20": "TARGET.COM * 800-591"}|Target            |home supplies|           |                   |
|                           |First 20|{"f20": "ACME NO. 17 STOW OH"} |Acme              |groceries    |           |                   |
|                           |First 20|{"f20": "AT&T *PAYMENT 800-28"}|AT&T              |internet     |           |                   |
|                           |First 20|{"f20": "AUTOZONE #0722 STOW "}|Autozone          |auto maint   |           |                   |
|                           |First 20|{"f20": "BESTBUYCOM8055267948"}|BestBuy           |home supplies|           |                   |
|                           |First 20|{"f20": "BUFFALO WILD WINGS K"}|Buffalo Wild Wings|restaurante  |           |                   |
|                           |First 20|{"f20": "CASHBACK BONUS REDEM"}|Discover Card     |financing    |           |                   |
|                           |First 20|{"f20": "CLE CLINIC PT PMTS 2"}|Cleveland Clinic  |medical      |           |                   |
|                           |                                                                         |           |                   |
|                           +-------------------------------------------------------------------------------------+                   |
+-------------------------------------------------------------------------------------------------------------------------------------+

```