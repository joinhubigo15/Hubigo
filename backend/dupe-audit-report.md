# Duplicate Business Audit

**Diagnostic only — no changes made.**

Groups of businesses sharing an identical name and address after the Railway import (336,022 businesses), checked against external place ID, phone, coordinates, and category overlap to judge whether each group is a real duplicate.

This is a separate, pre-existing limitation of the tier-1 dedup signature — unrelated to the crash/resume duplicate issue (already resolved separately: 2 rows removed, verified 336,022 businesses with no orphaned child records).

- Total groups: **76**
- Business rows involved: **155**

## Summary

| Verdict | Count | Meaning |
|---|---|---|
| True duplicate | 54 | Coordinates within ~30m, phones consistent — same real place scraped under two different Google Maps place IDs |
| Likely duplicate | 12 | Coordinates within ~100m but past the tight threshold, or weaker phone signal |
| Needs manual review | 9 | Missing coordinates and/or phone on one side — not enough signal to auto-classify |
| Legitimate separate | 1 | Coordinates far apart despite identical name/address text — real distinct businesses |

## Classification method

- **True duplicate** — coordinates within ~30m and phone consistent (or both external place IDs null with matching phone+coordinates).
- **Likely duplicate** — coordinates within ~100m with a differing place ID, weaker phone signal.
- **Legitimate separate** — coordinates ≥300m apart despite identical name/address text.
- **Needs manual review** — missing coordinates and/or phone on one side, insufficient signal to classify automatically.

---

## Groups

### True duplicate (54)

#### A1 beef stall

365G+H5C, Vanniar 2nd St, RR Nagar, Choolaimedu, Chennai, Greater Chennai, Tamil Nadu 600094, India

> Coordinates 0.6m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `0.6m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `6afc52bd-bb6d-414f-8bfc-40d9ffccf348` | `0x3a52670063a66297:0xf4eb691e5e2667fe` | 9789003103 | 13.058935 | 80.225393 | Meat Store |
| `f2ae6c92-3bdd-45d3-8b08-e7eda6a8e4a3` | `0x3a5267002f053159:0xd93d120e48f3171` | null | 13.05894 | 80.225395 | Meat Store |

#### Adukkala Restaurant

48, 7th Main, TC Palya Main Rd, Hoysala Nagar, Ramamurthy Nagar, Bengaluru, Karnataka 560016, India

> Coordinates 0.8m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `0.8m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `9a65e43a-4538-4e33-b87c-50450526fbca` | `0x3bae11007509d28d:0xe113e5b288d45184` | null | 13.015645 | 77.66738 | Restaurant |
| `c70d9b63-e803-4078-9377-a50cb6101edb` | `0x3bae11c4fa6a3931:0x287b5e81cdddd6e` | 7899990230 | 13.015652 | 77.667383 | Restaurant |

#### Affordable Orchid service apartment in korattur, Chennai - Three-Bedroom Apartment

Korattur Tank, Korattur, Greater Chennai, Puthagaram, Tamil Nadu 600076, India

> Coordinates 0m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `0m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `1ea89088-ce22-4c38-8f16-9ee351d7929d` | `0x3a526480b11552b9:0xa40cba7d4339cd49` | null | 13.12574 | 80.19265 | Service Apartment |
| `b66a4b8f-e81d-4c6f-ab72-c0a2ad21e25f` | `0x3a526480b11552b9:0xccf7a1894ab7e88` | null | 13.12574 | 80.19265 | Service Apartment |

#### AirFix ac solutions

near Nandan Football Ground, Yellagondanpalya, Officers Colony, Victoria Layout, Bengaluru, Karnataka 560047, India

> Coordinates 11.3m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `11.3m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `9d373f73-0573-4902-8d78-1f8833c6378e` | `0x3bae15d29e58e0c1:0x9ab48bed60ad95a6` | 9845608545 | 12.962375 | 77.614684 | Air Conditioning Repair Service |
| `f0ac57db-9734-4732-840f-34b8a6bce926` | `0x3bae15a1d49b9b0d:0x17e6d04b7517ed35` | null | 12.962465 | 77.614733 | Air Conditioning Repair Service |

#### Ali Cottage

near Chicken Shop, Royal Colony, Hyderabad, Balapur, Telangana 500005, India

> Coordinates 19.4m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `19.4m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `871d4541-e269-486e-a2a7-c4fcd82f1f62` | `0x3bcba2bea8c3377f:0x52d12db0f6f4af80` | null | 17.317431 | 78.49282 | Cottage |
| `a06dbd37-7445-40cc-8500-2fe9d8c8327e` | `0x3bcba2bea867b9a9:0xcc85ce7d68991482` | null | 17.317594 | 78.492886 | Cottage |

#### Andy Villa

near Rainbow School, Modi Garden, Devara Jeevanahalli, Bengaluru, Karnataka 560006, India

> Coordinates 2.4m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `2.4m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `13669303-8243-4008-a03c-6ad2adc1dd16` | `0x3bae17ac75ed0019:0x1573e8d62db339c` | null | 13.016728 | 77.602001 | Villa |
| `6878ba5a-0a0b-4d8a-b7c0-28d69361701f` | `0x3bae17ac7593c97b:0xf6dbc40199347976` | null | 13.01675 | 77.602001 | Villa |

#### Antony Cottage

20, 3rd Cross St, Ramapuram, Periya Palayatamman Nagar, Manapakkam, Chennai, Greater Chennai, Tamil Nadu 600125, India

> Coordinates 6.9m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `6.9m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `9b522942-0b1d-40f1-8458-95334a95b2b3` | `0x3a5260c6950a2d91:0xc00fe54917a2f3ce` | null | 13.014513 | 80.172288 | Cottage |
| `f559ae72-7740-4e82-97aa-3a24b30179e8` | `0x3a52610033d31fb5:0xba6258f7ba6400bc` | null | 13.014457 | 80.172315 | Cottage |

#### Bhoomika botic

Nelamangala Bus Station, Jyothi Nagar, Nelamangala Town, Karnataka 562123, India

> Coordinates 8.5m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `8.5m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `35ab9dd5-d228-4999-b32a-eb601531e229` | `0x3bae25005dec95f7:0xc5a8d500700bce87` | null | 13.098833 | 77.393878 | Fashion Designer |
| `a0e092b5-fe9c-4263-a9af-0a62fa639dc3` | `0x3bae250055477853:0x9e7dd4c6ef1ba6bb` | null | 13.098836 | 77.3938 | Fashion Designer |

#### Blue Bells Villas

2JP7+36F, Veerannapalya Main Rd, near Manyata Tech Park Road, Govindapura, Nagavara, Bengaluru, Karnataka 560045, India

> Coordinates 0m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `0m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `0683ca31-fda5-412b-b9d5-fb1495417496` | `0x3bae17000ba35b29:0x5d6066b33acd04ca` | null | 13.035183 | 77.61306 | Villa |
| `c5b93fe9-9cae-45d3-8b5f-388fd202cbd5` | `0x3bae17002eebba29:0x1c866893177eb835` | null | 13.035183 | 77.61306 | Villa |

#### CHAI DUNIYA

G69M+9J2, Patancheru - Shankarpalli Rd, Kardanur, Hyderabad, Telangana 502300, India

> Coordinates 1.1m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `1.1m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `0fbf2948-9b04-4da6-90a8-51cda092ba89` | `0x3bcbf30062233dd9:0x5245968f0c34f6bb` | null | 17.51834 | 78.234024 | Cafe |
| `d19f251c-653a-4ee6-991b-91652355f739` | `0x3bcbf3001333ecb3:0x4ebb3722da0134f1` | null | 17.51835 | 78.234025 | Coffee Shop |

#### CM Stays Service Apartment - Near Chennai Airport - Pallavaram - Two-Bedroom Apartment

Pallavaram, Tambaram, Chennai, Tamil Nadu 600075, India

> Coordinates 0m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `0m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `0c948875-8844-4d93-8722-c341a1586411` | `0x3a525e2d4bccfa93:0x7e3d9de0e0470218` | null | 12.97606 | 80.14315 | Service Apartment |
| `7c495f39-2ffe-48aa-b0eb-77e857458e31` | `0x3a525e2d4bccfa93:0x7f4d78e7ea3162a3` | null | 12.97606 | 80.14315 | Service Apartment |

#### Cross Street Dorai Villa

Mahalingapuram, Nungambakkam, Chennai, Greater Chennai, Tamil Nadu 600034, India

> Coordinates 16.7m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `16.7m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `8936aa93-d469-4711-8f41-2dc6135f15e7` | `0x3a52665fff1c603f:0xa0634e744ebba92a` | null | 13.057675 | 80.232289 | Villa |
| `c451940f-d934-4674-a643-a815fcb99bea` | `0x3a52665fff7d9fa7:0xd8de9c88f46e6479` | null | 13.057692 | 80.232136 | Villa |

#### Devils room

3FHR+F6C, Thammenahalli Village, Thammenahalli, Karnataka 560107, India

> Coordinates 27.4m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `27.4m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `ac301d7a-11dd-46fd-aaa3-d3fd6efa46c1` | `0x3bae23007816d51f:0xc2bb9135b5f86a17` | null | 13.07834 | 77.490592 | Nightclub |
| `bc7be2c0-8155-4b31-be5f-1b213d3a73c3` | `0x3bae23003f4773f7:0x46d56af839ab6cab` | null | 13.078554 | 77.490467 | Nightclub |

#### Electronic City Cottage - One-Bedroom House

Shanthipura, Phase II, Electronic City, Bhovi Palya, Karnataka 560099, India

> Coordinates 0m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `0m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `4502852f-83f0-4954-9d0c-85de3eb67acf` | `0x3bae6cef3fdd2277:0x9ad95455b0342724` | null | 12.85158 | 77.686439 | Cottage |
| `af1db584-69ab-4020-b675-c04963213905` | `0x3bae6cef3fdd2277:0xe323fc70527797ee` | null | 12.85158 | 77.686439 | Cottage |

#### Elite M Security Services

1-11-153/1/2, 1st Ln, near Patanjali Shop, B.S Nagar, Shyamalal, Begumpet, Hyderabad, Telangana 500016, India

> Coordinates 1.2m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `1.2m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `114c0de4-09e0-443b-8fa2-99ee00f83d95` | `0x3bcb9193d6b4e58b:0xef4ee8014744d966` | null | 17.446191 | 78.460819 | Security service |
| `caf8feab-ffed-4636-ab85-761b1f65d343` | `0x3bcb91d67dde4c81:0xa771185534da4432` | 8341304809 | 17.446187 | 78.460829 | Security service |

#### Fast Track Foods

RMW2+R8V, 8th Cross Rd, Celebrity Paradise Layout, Doddathoguru, Electronic City Phase I, Electronic City, Doddathoguru, Karnataka 560100, India

> Coordinates 2.2m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `2.2m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `bf26e387-0bca-439c-91ce-92afcc6b5cb2` | `0x3bae6b003cd2764f:0xf81627d7c177b6ce` | 9739144447 | 12.848855 | 77.650237 | Fast food store |
| `dd638575-fd74-41d5-b31d-f449fba6eb7e` | `0x3bae6b00427dbaa5:0x9c72690b477fdfec` | null | 12.848875 | 77.650239 | Fast food store |

#### Grace catering service kandanchavadi

No 37, Periyanagaki Street, Lakshman Nagar, Perungudi, Chennai, Greater Chennai, Tamil Nadu 600096, India

> Coordinates 0m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `0m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `4e31559b-2036-45cf-b543-a80f1ec7df0b` | `0x3a525d0078970d1d:0x9b906af00f7db7b6` | null | 12.967717 | 80.249841 | Catering Service |
| `dbaa5396-b39d-4927-bf67-811d438f2e9a` | `0x3a525d005b48bafb:0x7cfeeb33d173b416` | null | 12.967717 | 80.249841 | Catering Service |

#### Innasappa Villa

19, Bharati Nagar, Shivaji Nagar, Bengaluru, Karnataka 560001, India

> Coordinates 5.9m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `5.9m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `112a9e2f-44d9-4f71-a6bb-ce3d4a7f3a40` | `0x3bae16f532ac44e3:0x5a3a69092a894fe9` | null | 12.990539 | 77.609961 | Villa |
| `a0079256-4857-4818-ac8b-b9b7af306360` | `0x3bae16f532a8d8bd:0x39e3a9807f7ceff0` | null | 12.990569 | 77.609916 | Villa |

#### Jameel Cottage

Qalender Nagar Road, Owaisi Nagar, Hasnabad, Santosh Nagar, Hyderabad, Telangana 500059, India

> Coordinates 3.9m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `3.9m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `16d777ea-adfc-4eb6-907e-f024fd341064` | `0x3bcb987185edca43:0xadf55cc9e10bffad` | null | 17.345287 | 78.504133 | Cottage |
| `91dbabd4-f9b5-468b-a3e0-d2e7f8ce0dda` | `0x3bcb9871857c724d:0xd89595bdc17fc5f2` | null | 17.34531 | 78.504161 | Cottage |

#### JJ Cottage

15, Lake View Enclave Rd, Bharathi Nagar, Krishnarajapuram, Bengaluru, Karnataka 560049, India

> Coordinates 0m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `0m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `01220d42-738d-44c6-812e-e0892da57898` | `0x3bae110047fe1a7f:0x7b06a0ed82510de5` | null | 13.016433 | 77.725202 | Cottage |
| `27683150-fd30-47a5-b44d-edad690ea4e4` | `0x3bae110003543c35:0x72340604e68bf08` | null | 13.016433 | 77.725202 | Cottage |

#### Karnataka auto disel work

2F4C+P2C, Bengaluru, Kachohalli, Karnataka 562162, India

> Coordinates 2.3m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `2.3m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `3e8e5181-eb32-480d-aa6b-4972b77b986d` | `0x3bae3b000fabc9db:0x801b1cbd13740c3c` | null | 13.006949 | 77.469931 | Mechanic |
| `a1932e9b-faaf-4079-ba20-3928efa03e01` | `0x3bae3b003de18ca5:0x8b2b6a7ef17ef739` | null | 13.00696 | 77.469913 | Mechanic, Vehicle Service Shop |

#### KARNATAKA GRAIN & FOOD PRODUCTS INDIA PRIVATE LIMITED

321, 5th Cross Rd, Shetty Layout, 5th Main, Ullal Uppanagar, Bengaluru, Karnataka 560110, India

> Coordinates 10.7m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `10.7m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `0d2190b8-9b9f-4a00-973b-176a32acabd0` | `0x3bae3fd97708bbe5:0xd583b2eb1c301036` | 8073299455 | 12.959255 | 77.474775 | Agricultural products, Farm Store |
| `158dbae1-6d84-4b2c-9865-d50c525f3a64` | `0x3bae3f1dd5fdc535:0x3377f591b4c2aa21` | null | 12.959231 | 77.474679 | Agricultural products |

#### Karu saree pre pleating

57-20, Govinda Swamy St, Perambur, Chennai, Greater Chennai, Tamil Nadu 600011, India

> Coordinates 0m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `0m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `2c545cc3-2d7b-4a9d-89c7-d9cafeffa225` | `0x3a5265005d364e8b:0xc754f23bc01925f0` | null | 13.112098 | 80.249927 | Saree Store |
| `921b8849-948a-49ce-9aee-e80905d361a4` | `0x3a52658df133b24b:0x24672c138ffe47bd` | null | 13.112098 | 80.249927 | Saree Store |

#### Kishore Villa

3rd Circular St, Jawahar Nagar, Perambur, Chennai, Greater Chennai, Tamil Nadu 600082, India

> Coordinates 8.3m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `8.3m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `16b123c3-c73d-4338-b63f-31da1ec7ab20` | `0x3a52645265033025:0xa5e6d14ab9a8e3a7` | null | 13.115594 | 80.228806 | Villa |
| `ccb91609-c11f-40ec-a71b-52c4d8bc2b6f` | `0x3a526452645e7f45:0x14cc71f888af6ae8` | null | 13.11566 | 80.228842 | Villa |

#### Koithra villa

646, 2nd Cross Rd, Jumbo Sawari, Royal County, 8th Phase, Gottigere, Bengaluru, Karnataka 560083, India

> Coordinates 0m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `0m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `3063bbe1-c0a4-4d4b-aaf2-0af81f777703` | `0x3bae6abb81d6ed0f:0x2937f24f3c01337c` | null | 12.859209 | 77.576285 | Cottage |
| `e3a68d90-32a7-45be-8fde-5b91f070c8e9` | `0x3bae6b002a2a3071:0xa577ab819b4e69db` | 9741566228 | 12.859209 | 77.576285 | Villa, Cottage |

#### Kpa exotic pets chennai

22, PRK Sharma St, Vimlapuram, Salai Ma Nagar, Manali, Chennai, Greater Chennai, Tamil Nadu 600068, India

> Coordinates 3m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `3m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `6a1d644a-2c14-4809-b329-56d9859f537c` | `0x3a52650055e7d9c3:0xd4de490516d97f8d` | null | 13.165256 | 80.259809 | Pet Store |
| `78b31170-4915-42cf-9a12-4de840f63b0a` | `0x3a52650019d616d5:0x2557666b32a11275` | null | 13.165234 | 80.259809 | Pet Store |
| `96ee3db9-930d-49d6-8c4f-4596b0f904d2` | `0x3a5265001424368d:0x8ad461db71629c19` | null | 13.165261 | 80.259809 | Pet Store |

#### La Marvella - Bengaluru

1, South End Circle, La Marvella, 14th Cross Rd, next to Infosys Science Foundation, 2nd Block, Jayanagar, Bengaluru, Karnataka 560011, India

> Coordinates 9.2m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `9.2m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `36c7cef2-73d2-45ad-95ea-7bca0816394d` | `0x3bae1596c7a15525:0x470e277f27a601c5` | 8043335333 | 12.936923 | 77.580633 | Hotel, Nightclub, Serviced Accommodation, Lodge, Resort |
| `a95e7abb-ca3b-4be5-b432-b7d7d1be208a` | `0x3bae15ad621891bf:0x36f44a6af2dbd2cf` | null | 12.936841 | 77.580645 | Serviced Accommodation |

#### M.A.C Cosmetics

Orion Mall, Dr Rajkumar Rd, beside Metro Cash And Carry, Rajajinagar, Malleshwaram, Bengaluru, Karnataka 560055, India

> Coordinates 6.4m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `6.4m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `ba6e60cb-2d4a-4861-ac65-821c3148cec4` | `0x3bae3dc4758f823d:0x58188a57a88c314f` | 8022682147 | 13.011234 | 77.554709 | Cosmetics Store |
| `edf2a9b3-ce6e-4373-bf43-7c980499b7f4` | `0x3bae40e6b7b0bedb:0xae77b4a6f7498ec5` | 8022682147 | 13.011234 | 77.55465 | Cosmetics Store |

#### MZink Tattoo Studio

9, Mookathal St, Perumalpet, Purasaiwakkam, Chennai, Greater Chennai, Tamil Nadu 600007, India

> Coordinates 1.2m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `1.2m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `a3566944-4bf9-4b35-9668-8db32629c112` | `0x3a526686c9a54541:0x45eddc465155d39f` | 9884265415 | 13.089863 | 80.256179 | Tattoo Shop |
| `f562d92f-4a64-4a18-ac82-403c69f8ae2c` | `0x3a52659627d8dc3b:0x942e5062de5c42a3` | null | 13.089853 | 80.256176 | Tattoo Shop |

#### Nanthu Sai Boutique

124H, Nehru Nagar, I.G, TNHB Mig V Block, Avadi, Tamil Nadu 600054, India

> Coordinates 2.2m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `2.2m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `3ea0297e-04a0-4750-8ba5-824b4ea09faa` | `0x3a526300483fcd87:0x5299595cafedf9c1` | null | 13.110695 | 80.102747 | Boutique |
| `69f34750-197c-4998-a428-13e818fc2b26` | `0x3a52630004b27549:0x44a4941b11e14818` | null | 13.110702 | 80.102728 | Saree Store, Boutique |

#### Pain relief physiotherapy home care in perumbakkam

W662+78P, Pain relief physiotherapy, Kailash Nagar Main Rd, Jalladianpet, Perumbakkam, Tamil Nadu 600100, India

> Coordinates 0m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `0m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `4cc95348-545d-4948-80d8-c28871d5410a` | `0x3a525d007647289b:0xd0b9eeea404df583` | null | 12.910702 | 80.200842 | Pain Management Clinic |
| `dfdaa40d-0dd8-4e94-85c0-68e6dee73865` | `0x3a525b0004bd3ac9:0x70d4b7ba9b72c668` | null | 12.910702 | 80.200842 | Pain Management Clinic |

#### Papu cottage

Vijayarangam Layout, Jayanagar, Bengaluru, Karnataka 560004, India

> Coordinates 5.1m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `5.1m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `186a23cd-97ab-46ef-97d4-86790fcbb4a5` | `0x3bae159100ad1439:0xa452924bcf7f11c6` | null | 12.93559 | 77.576411 | Cottage |
| `da2d8727-669c-4830-a485-79ca33040f58` | `0x3bae1591012a91d3:0xf2eb0c2d64e2bd8` | null | 12.93559 | 77.576458 | Cottage |

#### Potti villa

3G6X+MJ8, Devappa Layout, Ramachandrapura, Jalahalli East, Bengaluru, Karnataka 560013, India

> Coordinates 14.1m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `14.1m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `82f78be5-cdcd-4f4c-be7a-b947639c5bad` | `0x3bae230011f68831:0xa9da9815a7eaf7a3` | null | 13.06199 | 77.549227 | Villa |
| `e76e5bb1-1fd7-424d-90aa-5df9bb3f9260` | `0x3bae23006fab11cb:0x62400502b8cd15a4` | null | 13.061897 | 77.549315 | Villa |

#### Prashasti Free Medical Guidance & Mind Care Psychological Counselling Clinic

183, Avvai Shanmugham Salai, Gopalapuram, Chennai, Greater Chennai, Tamil Nadu 600086, India

> Coordinates 0m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `0m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `35ef7bd1-ef33-4ccb-a1ce-31081cffc5eb` | `0x3a5267007d2feb3f:0xa73b35e103c2d04` | null | 13.050866 | 80.255368 | Psychiatric Clinic |
| `fcfd4775-76c9-4eb0-bc91-455c43327d10` | `0x434b5fd8a872728d:0x100a9e53e7ac809c` | 7338706244 | 13.050866 | 80.255368 | Psychiatric Clinic |

#### Pushpa Villas

199, 4th Main Rd, Poornaprajna Nagara, Vaddara Palya, Kodipur, Bengaluru, Karnataka 560061, India

> Coordinates 6.8m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `6.8m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `00531bbf-b6ca-4a0d-bb92-e9e0135d0ef2` | `0x3bae3fba80d5b1d1:0x8246467d4c852a78` | null | 12.907269 | 77.530244 | Villa |
| `624d93b0-ddbf-49d6-9501-fb67cbf7ff57` | `0x3bae3fba86cd85d1:0x14e2e5d21130a0c4` | null | 12.907211 | 77.530225 | Villa |

#### Rayon automobiles

56c, 7, Mariamman Koil St, Periyar Nagar, Pallavaram, Chennai, Tamil Nadu 600043, India

> Coordinates 1m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `1m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `4600dffa-7c83-4244-8c42-3d83272a9e3e` | `0x3a525f004cc7df7d:0xd6e2129dd32c319c` | null | 12.96839 | 80.14739 | Automobiles body Parts Store |
| `dbb10443-90ab-4e99-9b62-30376addc230` | `0x3a525f00517839fb:0x9e49959719773fd2` | null | 12.968391 | 80.147399 | Automobiles body Parts Store |

#### Rosewood Villa

Harithavanam Colony Rd, Haritavanam Colony, Bachupally, Hyderabad, Telangana 500118, India

> Coordinates 18.7m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `18.7m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `a8266aeb-1b9c-4b05-a1e9-8fb8b4fd8c24` | `0x3bcb8dc6ad96d51d:0xe0907f6acbf89628` | null | 17.543521 | 78.36659 | Villa |
| `b05183c3-b966-4d6e-bc3f-b62cb75c8516` | `0x3bcb8dc6ae39b945:0xbb054ed86304cfe2` | null | 17.543689 | 78.366601 | Villa |

#### RP Game Gadgets

4, 2nd Main Rd, LIC Colony, Pammal, Chennai, Tambaram, Tamil Nadu 600075, India

> Coordinates 3.1m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `3.1m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `1b7691f1-649b-4df9-9a12-c9b0661aec9e` | `0x3a525fd0e15b4717:0x174c2aa569febc67` | 9500144870 | 12.974811 | 80.127667 | Game Store |
| `371dff0f-0724-4fb0-81cc-9d534867f768` | `0x3a525f001d9eb4f5:0xa73c9e5aada56da9` | null | 12.974814 | 80.127695 | Game Store |

#### Samir villa

80, EVK Sampath Salai, near Shutan International, Periamet, Vepery, Periamet, Chennai, Greater Chennai, Tamil Nadu 600007, India

> Coordinates 0m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `0m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `951446e4-80af-40db-8cc6-051a0aa43945` | `0x3a5265007c9a0d79:0x7f6cd3c7fc610b05` | null | 13.087623 | 80.262977 | Villa |
| `9619f752-adfe-4c8c-9068-cc733ceb2814` | `0x3a526500688eae9b:0x371a71d6e083b075` | null | 13.087623 | 80.262977 | Villa |

#### Shalom cottage

221, CL Layout Rd, Nanjappa Layout, Adugodi, Bengaluru, Karnataka 560030, India

> Coordinates 4.5m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `4.5m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `70f05bf9-330f-49c0-b8d8-849a4d071479` | `0x3bae144ccfb36c19:0x6dcb9d9be489d52f` | null | 12.937593 | 77.608309 | Cottage |
| `b1e1cf8f-5a47-4d77-bab2-522022047373` | `0x3bae1578cc783585:0xcd973955ed03d0f5` | null | 12.937558 | 77.608329 | Cottage |

#### Shashi's Villa

KHB Colony, Tumkur, Stage 1, KHB Colony, Basaveshwar Nagar, Bengaluru, Karnataka 560079, India

> Coordinates 19.8m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `19.8m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `3b89fee0-5ea0-41be-bfd1-b0636265ded9` | `0x3bae3dc0f7385077:0xd0954efcb2a911b6` | null | 12.984941 | 77.535844 | Villa |
| `4c7c497d-9ceb-4f1a-8166-5cdb54e3c6fe` | `0x3bae3dc0f9f68297:0x2a263d8642bbb13b` | null | 12.984779 | 77.535768 | Villa |

#### Shri Krishna Juice Center

353, BWSSB Pipeline Rd, Vikram Nagar, Kumaraswamy Layout, Bengaluru, Karnataka 560111, India

> Coordinates 0m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `0m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `7d1dadbd-6713-43a5-9213-8de4cf0586aa` | `0x3bae3f002a7055c9:0x2208922dec0b4ba9` | null | 12.898478 | 77.558443 | Juice Shop |
| `8f6896ed-582f-453a-84f3-86242e0fc836` | `0x3bae3f000f1bee41:0x959b7d91bf6eb530` | null | 12.898478 | 77.558443 | Juice Shop |

#### Smart Iron Xpress

Mariappan palaya, Mahakavi Kuvempu Rd, M.R Palya, Rajajinagar, Bengaluru, Karnataka 560021, India

> Coordinates 2m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `2m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `06c116a7-8890-4080-8b50-033c77163143` | `0x3bae3d00744dce5d:0xcb9941901921853b` | null | 12.997672 | 77.559112 | Laundry Service |
| `66ff0d8f-9f8f-4891-b474-82216ad8c495` | `0x3bae3d0070b46899:0xa541310c1973604a` | null | 12.997664 | 77.559095 | Laundry Service |

#### Soundarya Villa

141, Raja Reddy Layout, Havanur Layout, Bagalagunte, Bengaluru, Karnataka 560073, India

> Coordinates 0.8m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `0.8m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `be5a9ed3-3110-4cf8-bbd4-5f2963ab7610` | `0x3bae3cd20f6c6e7d:0x361c93fd12dc674a` | null | 13.048504 | 77.505106 | Villa |
| `c3c79a37-4812-41d7-ba23-dc38b31c85b3` | `0x3bae3cd20f6cb9f9:0xb8e398aae0dc90a0` | null | 13.048506 | 77.505099 | Villa |

#### Sri hombale tent house event and management

Veeraiah Enclave, 4th cross, Veeraiah Nagar, Arasinakunte, Dasanapura, Nelamangala Town, Karnataka 562123, India

> Coordinates 0m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `0m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `3c0fda98-892e-4635-bbe2-34ea5ae8ef04` | `0x3bae25007d7a6e1f:0xda76bce314a5c748` | null | 13.073822 | 77.423457 | Event Rental Service |
| `97b7efd1-2e88-4423-bf87-4c4e04861387` | `0x3bae250040b5ef03:0xeaeb8eb6764dd4f5` | null | 13.073822 | 77.423457 | Event Rental Service |

#### SRI MALLIKARJUNA HARDWARE

CHJ2+24C, Karthikeya, Nacharam, Hyderabad, Secunderabad, Telangana 500076, India

> Coordinates 0m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `0m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `0b7cfba8-a0f7-4895-b66b-a94db9b113ae` | `0x3bcb990068fa2417:0xa08b6ed5c4dc3849` | null | 17.430059 | 78.550261 | Hardware Store |
| `4fb418af-7b41-44fc-ba7e-81d90751e2df` | `0x3bcb990053d3c02d:0x2a4e44a8eefd4ca3` | null | 17.430059 | 78.550261 | Hardware Store |
| `ed52800e-5240-45c6-944e-34faa3f49acd` | `0x3bcb990027228ad9:0xf987f94fe52e1471` | null | 17.430059 | 78.550261 | Hardware Store |

#### Telangana State Central Library

Ashok Bazar, Afzal Gunj, Hyderabad, Telangana 500012, India

> Coordinates 13.4m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `13.4m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `487eb0af-e824-472b-8432-87cd33276381` | `0x3bcb9829771c4681:0xee8403bc20baad7` | null | 17.374302 | 78.478125 | Library |
| `edb38e00-8a5f-403f-9c63-310374045d53` | `0x3bcb982976f6efab:0xb5113c31f1d7bd8d` | null | 17.374216 | 78.478214 | Library |

#### Unique Celebration & Hotel Luxury Rooms

8-7-91/164, near Pioneer Hospital, Phase 4, Hasthinapuram South, Hastinapuram, Hyderabad, Telangana 500097, India

> Coordinates 0m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `0m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `3d021879-93bd-48ee-afcd-09bc02aa07ed` | `0x3bcba3e2f4ac247b:0x64359e7d9f7cdda0` | 9032263888 | 17.324966 | 78.554584 | Lodge |
| `ff8bc752-db1e-42f2-ac26-d37effc16c32` | `0x3bcba39cdcb8e9f7:0x323ab9a8c4333b82` | null | 17.324966 | 78.554584 | Lodge |

#### UPBEAT NUTRITION

594, 2nd Main Rd, Stage I, Kengeri Satellite Town, Bengaluru, Karnataka 560060, India

> Coordinates 9.6m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `9.6m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `3e97e622-93a6-4440-a665-a09f1a399763` | `0x3bae3f000ae34131:0x3e837130314e0414` | null | 12.913042 | 77.480336 | Nutritionist |
| `6b4588e5-224f-4186-b2bb-d170a2e1a442` | `0x3bae3f002a053b07:0xf570089911846633` | null | 12.913111 | 77.480282 | Supplement Store |

#### Villa-19

SAI AISHWARYA COLONY PARK, Mallikarjun Nagar, Parvathapuram, Parvathapur, Peerzadiguda, Hyderabad, Telangana 500098, India

> Coordinates 9.3m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `9.3m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `0a510895-85ef-4d94-9b19-4f0dbe819772` | `0x3bcb9efbd9b11b71:0xc498020ab2d6f156` | null | 17.396209 | 78.605625 | Villa |
| `d0271636-9167-46fc-ba5e-16019f943402` | `0x3bcb9efbd9dac471:0x55149bfd8cc43173` | null | 17.396286 | 78.605591 | Villa |

#### Villa-9

MANASAROVAR VILLAS II, Lotus Pond Colony, Ward No 7 Secunderabad, Ved Vihar, Tirumalagiri, Secunderabad, Telangana 500015, India

> Coordinates 15.1m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `15.1m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `c2cdf72e-6131-438f-83ab-d186c13c6338` | `0x3bcb9a8cf9f4af2d:0xc6cbdef920c01475` | null | 17.483221 | 78.495451 | Villa |
| `d4feae2f-c085-45ad-913a-51c8bd3db57a` | `0x3bcb9a8cfbd3b7e5:0x2d5f989f7d3c1ff2` | null | 17.483355 | 78.495474 | Villa |

#### Vishnu Diagnostic and Wellness Centre

66, 4th Cross Rd, AG's Layout, Mathikere, Bengaluru, Karnataka 560054, India

> Coordinates 0m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `0m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `1f549e9b-a043-4e2b-aa5d-0af31cc9f47a` | `0x3bae1700548ac653:0xc37841038eddfc63` | null | 13.033735 | 77.568027 | Scan center, Wellness Center, Diagnostic Center |
| `d94e5eb1-2605-4352-8a1f-5e3f7c877d1a` | `0x3bae17003fdd674b:0x37fa87581598fa0e` | 9108705522 | 13.033735 | 77.568027 | lab services, Scan center, Blood Testing Service, Diagnostic Center |

#### Yash Cottage

Anglo Indian Quaters, Yellagondanpalya, Austin Town, Victoria Layout, Bengaluru, Karnataka 560047, India

> Coordinates 18.4m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `18.4m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `2a12b78d-4fd4-4c89-b84e-9c6c81beb700` | `0x3bae142957ee6973:0xdcd4678b260e436c` | null | 12.963094 | 77.613583 | Cottage |
| `83aec90b-c9e6-435c-93ea-a483d29c21c1` | `0x3bae15f024ec7071:0x1f7275867993476b` | null | 12.962946 | 77.613658 | Cottage |
| `842ba964-fe4f-40d0-80a3-46dec4f4271b` | `0x3bae1429570bbebd:0x42ee060d8274f5f6` | null | 12.963057 | 77.613717 | Cottage |

#### Zion Cottage

New Kubera Nagar, Madipakkam, Chennai, Tambaram, Tamil Nadu 600091, India

> Coordinates 14.6m apart (same ~30m grid cell) and phones consistent, but different external place IDs — same physical business scraped under two different Google Maps place IDs.
>
> Dedup key matched: `false` · Max distance: `14.6m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `27796818-6549-43ea-aa37-a3f4315adda1` | `0x3a525ddb8456af6f:0xce00592dbd3b9fdb` | null | 12.95922 | 80.195374 | Cottage |
| `668ca092-9336-4ab7-87d3-085936c184e5` | `0x3a525ddb84c05d39:0x3dbba7209e5b000f` | null | 12.9591 | 80.195429 | Cottage |

### Likely duplicate (12)

#### Apollo Hospital Greams Lane

Greams Lane, 21, Greams Rd, Thousand Lights West, Thousand Lights, Chennai, Tamil Nadu 600006, India

> Coordinates 12.8m apart with differing external place ID; phone differs — probably the same business, but past the tight same-place threshold.
>
> Dedup key matched: `false` · Max distance: `12.8m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `2bba1df5-4613-44bb-b0a4-be5c03162446` | `0x3a52666accdfbb59:0x2e0d1b10a5e06d2f` | 8069049756 | 13.063182 | 80.251537 | lung Clinic, Hospital, ENT Clinic, Psychiatric Clinic, Surgical Center, Multi specialist, DOCTOR, Pain Management Clinic, Eye Care Clinic, Nutritionist, Medical Clinic, cosmetic service, Urology Clinic, Cancer Care Center, Diagnostic Center, Cardiology Clinic, Orthopedic Clinic, Neurology Clinic, Weight Loss Service, Women's Health Clinic |
| `415c1dd8-51bd-4f9e-8a4a-1e1f9e5dcd0f` | `0x3a52674c9fcd2e9f:0x14b5600467000437` | 8062970914 | 13.063085 | 80.251473 | ENT Clinic |

#### Bag Mall

3, Arcot Rd, Devi Nagar, Porur, Chennai, Greater Chennai, Tamil Nadu 600116, India

> Coordinates 24.6m apart with differing external place ID; phone differs — probably the same business, but past the tight same-place threshold.
>
> Dedup key matched: `false` · Max distance: `24.6m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `e98464c3-56ff-467d-9716-55ff6ce870f2` | `0x3a5261fa70d4d71d:0xbbbedecb72071eb7` | 7806905545 | 13.035176 | 80.156167 | Handbag Store, Bag Store |
| `eae9c162-dec7-4694-9156-c8405e4b8bc1` | `0x3a526144ea3826a9:0xab72687c1dc9a407` | 8838010906 | 13.03539 | 80.156111 | Handbag Store, Bag Store |

#### Brijesh Villa

Sai Nanditha Enclave, Kutbi Guda, Kachiguda, Hyderabad, Telangana 500027, India

> Coordinates 41.9m apart with differing external place ID; phone missing on one side — probably the same business, but past the tight same-place threshold.
>
> Dedup key matched: `false` · Max distance: `41.9m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `2567ac15-a5e1-4c85-938e-2d4b0b294587` | `0x3bcb99cc007d0857:0x5980e9dac420a930` | null | 17.387448 | 78.492198 | Villa |
| `eaea3468-5e47-4d5d-a0bd-4e2d6dc762be` | `0x3bcb99ceabcba247:0xdb29389360c45348` | null | 17.387766 | 78.491987 | Villa |

#### DS COLOUR WORLD

opp. to National Public School Ullal, Ullal, Ullal Uppanagar, Bengaluru, Karnataka 560056, India

> Coordinates 57m apart with differing external place ID; phone missing on one side — probably the same business, but past the tight same-place threshold.
>
> Dedup key matched: `false` · Max distance: `57m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `57276f7a-8196-49cb-8705-408aec8f600c` | `0x3bae3fc38ae02365:0xfdb2c0d77f5d3d60` | null | 12.956052 | 77.477988 | Paint Store |
| `fab733fa-f852-4357-8d96-2e41f1ad5bfc` | `0x3bae3f0043d1aaeb:0x38c3fdc856b940ef` | null | 12.956564 | 77.478008 | Paint Store |

#### LIBRARY

LOYOLA ACADEMY, Spring Fields Colony, Jeedimetla, Secunderabad, Telangana 500010, India

> Coordinates 73.1m apart with differing external place ID; phone missing on one side — probably the same business, but past the tight same-place threshold.
>
> Dedup key matched: `false` · Max distance: `73.1m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `93271ad0-b4f6-400c-9b7b-08af40b24afb` | `0x3bcb9abb2d61089b:0xaa5c97eedc4d3879` | null | 17.506008 | 78.486627 | Library |
| `9fd02ee0-426f-46e3-8e7c-360c32d3ffe1` | `0x3bcb9aa4d0d59551:0xb442a3a32fed3c8a` | null | 17.506291 | 78.486005 | Library |

#### Mukund Apartments

4th Cross, 5th Main, Chamarajpet, Raghavendra Colony, Chamrajpet, Bengaluru, Karnataka 560018, India

> Coordinates 30.4m apart with differing external place ID; phone missing on one side — probably the same business, but past the tight same-place threshold.
>
> Dedup key matched: `false` · Max distance: `30.4m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `af3d47a2-10ec-4320-871d-d62e24fa8505` | `0x3bae15f9b7dc802b:0x5749d1752730aef8` | null | 12.956112 | 77.565372 | Serviced Accommodation |
| `b7a17792-a8bb-44be-acec-ada62329d622` | `0x3bae15f9b7e1d04b:0x6099182091ad998d` | null | 12.955859 | 77.565479 | Service Apartment, Serviced Accommodation |

#### OLYMPIA IVY SPORTS ACADEMY

45, Riches Garden Main Rd, Raghavendra Nagar, Ramamurthy Nagar, Bengaluru, Karnataka 560016, India

> Coordinates 74m apart with differing external place ID; phone missing on one side — probably the same business, but past the tight same-place threshold.
>
> Dedup key matched: `false` · Max distance: `74m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `33dafc1a-61ee-4bc5-b742-c15b68489051` | `0x3bae11888f30531d:0x238d507654c164b7` | null | 13.021882 | 77.675285 | Sports School, Swimming Pool |
| `ae428080-9543-411c-ad45-8c66a87d84cf` | `0x3bae110049832a53:0xd8b581fb3dc076e9` | null | 13.021217 | 77.675311 | Sports School |

#### Pristyn Care

Golden Hawk Building, No 1/8/208, PG Road, Jogani, Ramgopalpet, Hyderabad, Telangana 500003, India

> Coordinates 7.6m apart with differing external place ID; phone differs — probably the same business, but past the tight same-place threshold.
>
> Dedup key matched: `false` · Max distance: `7.6m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `5d8dd9f2-338d-4fad-b428-0f7a1e1dd8f8` | `0x3bcb9168a73684e3:0x54c5261d85f1b720` | 8065105055 | 17.440133 | 78.483353 | Surgical Center |
| `a2d4de99-7e8c-47c0-913b-9d452c0ec4bc` | `0x3bcb9b6dc4f0f319:0x2c07f759190d16e8` | 8065105056 | 17.440201 | 78.483343 | Surgical Center |

#### The Plaza

Tourism Plaza, 6-3-870, Greenlands, Begumpet, Hyderabad, Telangana 500016, India

> Coordinates 46.8m apart with differing external place ID; phone differs — probably the same business, but past the tight same-place threshold.
>
> Dedup key matched: `false` · Max distance: `46.8m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `16b44428-e74c-4abf-bad3-186fc36fd60a` | `0x3bcb90b65bfda15b:0xbd03605dbe1b3e35` | 4049495959 | 17.434248 | 78.455134 | Cafe, Coffee Shop |
| `42afbf7d-8ed4-462f-87ec-06c3ab1cb8a4` | `0x3bcb90b6f9c4f8b9:0x4f22f63e20f1a999` | 9553833318 | 17.433908 | 78.454874 | Hotel, Serviced Accommodation |

#### Villa 1833

Block A, Sahakar Nagar, Bengaluru, Karnataka 560092, India

> Coordinates 34.6m apart with differing external place ID; phone missing on one side — probably the same business, but past the tight same-place threshold.
>
> Dedup key matched: `false` · Max distance: `34.6m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `5e5f4d78-d31b-431e-b5c3-c0f9bb61de42` | `0x3bae181b936ce9e7:0x1203a2e4a1ab3c45` | null | 13.063451 | 77.57758 | Villa |
| `982ca0cf-613a-481a-a873-890a0b2fb048` | `0x3bae181beb17313b:0xcbad9d3d0fe3597` | null | 13.063665 | 77.577812 | Villa |

#### VILLA-2

ASTHIKA SAMAJ, 7th Main Rd, Malleshwaram, Bengaluru, Karnataka 560003, India

> Coordinates 30.8m apart with differing external place ID; phone missing on one side — probably the same business, but past the tight same-place threshold.
>
> Dedup key matched: `false` · Max distance: `30.8m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `e8f598c6-3bee-4478-8b73-812cb3a4da91` | `0x3bae1628ec17516d:0xfc8399571d072f4a` | null | 13.001431 | 77.565748 | Villa |
| `f94d0344-2fe6-499f-98e5-5e82dbbc20e0` | `0x3bae1628ebddbdf3:0x19ff86eb8bb911b1` | null | 13.001494 | 77.566025 | Villa |

#### Yashoda Hospitals

Alexander Rd, Kummari Guda, Shivaji Nagar, Secunderabad, Telangana 500003, India

> Coordinates 61.7m apart with differing external place ID; phone differs — probably the same business, but past the tight same-place threshold.
>
> Dedup key matched: `false` · Max distance: `61.7m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `4b0459ee-016b-4053-bd77-f378b2c09107` | `0x3bcb9b4a92dd1faf:0x28852b0f3009abed` | 4067232308 | 17.44222 | 78.49744 | Hospital |
| `82c0d5ee-a4c1-4d67-82fc-a1593d2919fe` | `0x3bcb9a17c24528a3:0x6c6b682a3240114d` | 4045674567 | 17.441754 | 78.497125 | Hospital, Surgical Center, Multi specialist, DOCTOR, Cancer Care Center, Cardiology Clinic |

### Needs manual review (9)

#### Anna Nagar Real Estates

1943, 18th Main Rd, Aishwarya Colony, Anna Nagar West, Anna Nagar, Chennai, Greater Chennai, Tamil Nadu 600040, India

> Missing coordinates and/or phone on one or more rows — insufficient signal to confidently classify automatically.
>
> Dedup key matched: `true`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `ca56207b-d0e3-4a08-b3df-140164c20f8d` | `0x3a5265a4313d9abb:0xc06bd8b18d60dc8e` | 8270410017 | 13.094394 | 80.205475 | Real Estate |
| `d5174ace-c590-47a1-8403-e4bca2357a22` | `null` | null | null | null | Real Estate |

#### BILLARDS JUNCTION

XG8V+W2V, 1st Main Rd, opp. to Shree Mahalakshmi Sweets Vijayanagara, Hoshalli Extension, Stage 1, Vijayanagar, Bengaluru, Karnataka 560040, India

> Missing coordinates and/or phone on one or more rows — insufficient signal to confidently classify automatically.
>
> Dedup key matched: `true`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `0727cc49-8bfd-4e5a-93a1-7e7b00c6353a` | `0x3bae3d06e8fe8fe7:0x77195a7ed79e64d7` | null | 12.967354 | 77.542547 | Pool Hall |
| `124c9d09-0366-439d-ac6c-a0faecc9de53` | `null` | null | null | null | Pool Hall |

#### Haami - Pet Food & Accessories Kokapet

1st Floor, MN Corner, above PIZZA HUT, Power Welfare Society, Kokapet, Hyderabad, Telangana 500075, India

> Missing coordinates and/or phone on one or more rows — insufficient signal to confidently classify automatically.
>
> Dedup key matched: `true`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `4a744035-a312-45e3-b8b3-ce76e2e37189` | `null` | 8186066066 | null | null | Pet Store |
| `63470bc1-faf1-4099-9b7c-3aa7731a0626` | `0x3bcb953d997f1f49:0x98e29b4789d7f3d7` | 8186066066 | 17.393278 | 78.341145 | Animal Feed Store |

#### HAAPS

E 79, 13th A Cross, Kanakapura Main Rd, near Metro Pillar NO.60, 1st Phase, J. P. Nagar, Bengaluru, Karnataka 560111, India

> Missing coordinates and/or phone on one or more rows — insufficient signal to confidently classify automatically.
>
> Dedup key matched: `true`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `9832321b-bb42-45c2-a061-1a341c43e108` | `0x3bae1543138d3843:0x5fa92eb9cc3c5726` | 9620175156 | 12.908888 | 77.573298 | Marketing agency, Digital Marketing |
| `9f166610-f70c-424e-be4d-f3bcf5968657` | `null` | null | null | null | Digital Marketing |

#### Jaya Jaya Sankara A/c Marriage Hall

No.10, 9th Cross St, Rajarajeswari Nagar, Periyar Nagar, Madipakkam, Chennai, Greater Chennai, Tamil Nadu 600091, India

> Missing coordinates and/or phone on one or more rows — insufficient signal to confidently classify automatically.
>
> Dedup key matched: `true`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `134dc1a4-7a96-43ba-ac04-417d371f95ec` | `null` | 9345985917 | null | null | Hall |
| `620035ee-63ef-41be-b114-341d5b607f33` | `0x3a525d8cd1618885:0xe5f8f717fa47ff5b` | 9345985917 | 12.961285 | 80.199396 | Event Venue, Hall |

#### Malarkodi construction

20, VOC St, West Tambaram, Tambaram, Chennai, Tambaram, Tamil Nadu 600045, India

> Missing coordinates and/or phone on one or more rows — insufficient signal to confidently classify automatically.
>
> Dedup key matched: `true`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `18e7757c-eefb-4803-a78b-0072b89b422c` | `0x3a525f007216d46d:0x5b6429d09dff4d05` | 9841921582 | 12.927937 | 80.113336 | Civil Services, Civil contractor |
| `f4489cb8-f694-4626-83a6-6f2c81aee011` | `null` | 9841921582 | null | null | Civil contractor |

#### Nagu Speech and Hearing

627/1, 8th B Main, 3rd stage 2nd block, Basaweshwara nagar, Rajajinagar, Bengaluru, Karnataka 560079, India

> Missing coordinates and/or phone on one or more rows — insufficient signal to confidently classify automatically.
>
> Dedup key matched: `true`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `93959a77-7ba8-4451-8ced-023bbd61330e` | `0x3bae3d031864d045:0xaa09e78b77acbced` | null | 12.991854 | 77.543567 | Speech & Hearing Clinic |
| `b9d0de3e-b5e4-46c0-a851-f1dafd94d361` | `null` | null | null | null | Speech & Hearing Clinic |

#### Osmania University

Amberpet, Hyderabad, Telangana, India

> Ambiguous signal combination (externalIdsDiffer=true, allPhonesMatch=false, maxDistanceMeters=132.2).
>
> Dedup key matched: `false` · Max distance: `132.2m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `52983a97-9a36-4565-b067-ab0d46b45794` | `0x3bcb9971a0691e33:0x7d190f2a686a424e` | null | 17.418004 | 78.527336 | University |
| `d7aecfef-f9af-41b3-9264-e0c2fb170130` | `0x3bcb9973bb0015e9:0x2b40415d8a716d20` | 4027098043 | 17.418923 | 78.526546 | University, College |

#### Veloria Grand Banquet Halls in Bangalore

4th Floor, above Olive Hotels, Aishwarya Crystal Layout, Singasandra, Bengaluru, Karnataka 560114, India

> Missing coordinates and/or phone on one or more rows — insufficient signal to confidently classify automatically.
>
> Dedup key matched: `true`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `9849c6e5-dbd2-4b85-a51d-78d9ac204694` | `0x3bae6bef70392311:0x2289a92bbd9b7711` | 8884331096 | 12.873487 | 77.650009 | Event Venue, Hall |
| `a93219be-eda0-4ae3-a365-891f2de62187` | `null` | null | null | null | Event Venue |

### Legitimate separate (1)

#### HDFC ERGO Insurance Agent: Kanchan Mishra

Ground Floor, No 524/A, 19th Main Rd, near Udupi Food Park, Sector 3, HSR Layout, Bengaluru, Karnataka 560102, India

> Coordinates 412.6m apart (different physical locations) despite identical name+address text — likely a generic name at two distinct real addresses.
>
> Dedup key matched: `false` · Max distance: `412.6m`

| ID | External Place ID | Phone | Lat | Lng | Categories |
|---|---|---|---|---|---|
| `4de37e02-32cb-4cfa-8f02-2d7371506a69` | `0x3bae15a28aaad6ff:0xa46fcc9cc8279734` | 8071888361 | 12.908918 | 77.644318 | Insurance |
| `9ca41381-40e4-49a6-8d12-949691764bce` | `0x3bae15526f68ad61:0x596d6b73bf3ab670` | 8071888361 | 12.905212 | 77.644132 | Insurance |

