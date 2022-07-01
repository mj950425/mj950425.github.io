---
layout: archive
permalink: /categories/java
title: 'Post about java.'
author_profile: true
sidebar_main: true
search: false
---

{% assign posts = site.categories.java %}

{% for post in posts %}
{% include archive-single.html type=page.entries_layout %}
{% endfor %}
