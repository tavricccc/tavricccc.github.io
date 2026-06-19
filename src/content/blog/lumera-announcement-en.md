---
title: "I Made a Multiplayer Card Game Called Lumera, Come Play"
description: "First time doing game dev, a personal learning project - 2-4 player card bluffing with face-down plays, challenges, and Russian roulette punishment. Opens right in the browser."
pubDate: 2026-06-19
updatedDate: 2026-06-19
lang: "en"
author: "Dan"
group: "lumera-announcement"
tags: ["Lumera", "Game", "Card Game", "Multiplayer", "announcement", "EN"]
draft: true
---

I recently made a card game called Lumera. After finishing it I thought it was actually pretty fun, so I figured I'd put it out there for people to try.

This is really just a personal learning project. I'd never touched game dev before, so this was my first attempt. Honestly a lot of the tech I learned on the fly - a good chunk of the code was written by Claude, where I'd figure out what I wanted, let it write the code, then go back and understand why it did things that way and tweak it myself. So if you're judging it as a proper indie game it's definitely not there yet, but as the output of a learning project I think it turned out alright. And it's genuinely pretty addicting to play.

![Lumera Home Page](https://img.danarnoux.com/posts/lumera-announcement/step1.png)

## How It Works

2 to 4 players, everyone gets a hand of cards. On your turn you play a card face-down and announce what color and number it is - but you can totally lie. After you play, anyone at the table can challenge you. If someone does, the card gets flipped and checked. Whoever's wrong goes to the roulette for punishment. You can learn the rules in five minutes, and a game takes about 8 to 10 minutes.

![Game Table](https://img.danarnoux.com/posts/lumera-announcement/step3.png)

My favorite part is the punishment roulette. It's not just "lose some health" - it works like Russian roulette: the first time you get caught you only have a 1/6 chance of getting hit, but if you keep getting caught the odds go up each time - 2/6, 3/6, all the way up. The sixth time it's 6/6, guaranteed hit. So lying once in a while is fine, but someone who keeps getting caught will eventually take themselves out. This mechanic is honestly the reason I wanted to make this game in the first place.

![Roulette Punishment](https://img.danarnoux.com/posts/lumera-announcement/step4.png)

The numbers on the cards can only go up, never down. And if nobody challenges, the pile on the table just keeps growing thicker and thicker - so mid to late game that pile becomes a huge bounty. Win a challenge and you take the whole thing. There's also more than one way to win - you can quietly play out your entire hand for a clean sweep, or play it safe by dropping a 0 for small guaranteed points. Multiple paths to victory, and that was intentional.

## Multiplayer

Open [lumera.danarnoux.com](https://lumera.danarnoux.com) in your browser and you're good to go, no download needed. For multiplayer just enter a room code, send it to your friends, same code same table, up to 4 players. If there aren't enough people the empty seats get filled by AI automatically. The AI has multiple difficulty levels and different personalities, so you can start a game solo anytime. The game supports both Chinese and English, and works on phones and tablets too.

![Online Multiplayer](https://img.danarnoux.com/posts/lumera-announcement/step2.png)

## What's Coming Next

On top of the base game, there's already an optional "Chaos Weather" mode you can toggle on. With it enabled, each round has a chance to trigger a random weather event - everyone draws cards, hands get shuffled, turn order reverses, stuff like that. Total chaos. Turn it on if you want excitement, leave it off if you want to play it straight.

Next up I'm planning a new mode called "Elements" - the four card colors each represent different elemental powers, and each color's cards will have unique effects. Players get random skills at the start of the game that charge up as you play cards of the matching color. Once charged you can unleash them, adding a whole new layer of unpredictability. The same cards become worth different things in different players' hands - it's not just about numbers and mind games anymore, there's actual strategy on top.

Card values are still being tuned based on how things actually feel in practice. These things take time, no rush. As long as I don't abandon the project, we're good.

## About the Lore

The game does have its own worldbuilding and lore. I got really into it while writing it. But I won't go into it here - if anyone's actually interested I'll write a separate post about it later.

## Come Play

Head to [lumera.danarnoux.com](https://lumera.danarnoux.com). I'd suggest going through the in-game tutorial first to get familiar with the rules, then hit "Play vs AI" to get a couple practice games in before inviting friends for multiplayer.

It's still in demo status right now. If you run into bugs, get stuck, find something unbalanced, or think the AI isn't smart enough - that's all expected. Just let me know. I genuinely want to hear what it feels like to play.

I'll be writing a few more posts down the line - one about how I built this thing step by step, and one about how the AI opponents were designed. But for now, go play.
