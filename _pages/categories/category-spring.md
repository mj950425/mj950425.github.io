---
layout: archive
permalink: /categories/spring
title: 'Post about spring.'
author_profile: true
sidebar_main: true
search: false
---

{% assign posts = site.categories.spring | sort:"date" | reverse %}

{% for post in posts %}
{% include archive-single.html type=page.entries_layout %}
{% endfor %}
