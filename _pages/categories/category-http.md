---
layout: archive
permalink: /categories/http
title: 'Post about http.'
author_profile: true
sidebar_main: true
search: false
---

{% assign posts = site.categories.http %}

{% for post in posts %}
{% include archive-single.html type=page.entries_layout %}
{% endfor %}
