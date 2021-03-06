---
title: Who wants to run my container?
date: 2016-09-27
author: Jie Yu & Jörg Schad, Mesosphere
category: Tooling
description: You have options in DC/OS and Apache Mesos. Learn about the universal container runtime, the rationalle for building it, and what lies ahead.
layout: article.jade
collection: posts
lunr: true
---

# Who wants to run my container?
Apache Mesos–the kernel on top of which DC/OS runs–has supported launching Docker containers since Mesos 0.20 was released, over two years ago. With the recent 1.0 release, Mesos introduced enhanced native support for Docker containers in the form of a universal container runtime. This allows Mesos -and therefore DC/OS, starting with the recent 1.8 release- to run Docker or AppC images without relying on the Docker daemon or rkt.

Before diving into the details, let’s have a brief look at the motivation for this feature.

## Motivation
DC/OS and Mesos support several [containerizers](https://github.com/apache/mesos/blob/master/docs/containerizer.md), which provide isolation between containers. Most widely used is the Mesos containerizer, which uses native OS features to provide isolation, and the Docker containerizer, which relies on the external Docker daemon  for isolation between containers. Internally, the Docker daemon relies on the same set of OS features as the Mesos containerizer.

Maintaining two containerizers is challenging for a few reasons. Adding any new features will require changes to both containerizers, which decreases the speed of adding new features to Mesos. Even worse, some global resources require coordination between the two containerizers, making them very hard to implement. Having the Docker daemon as an external dependency also increases the number of combinations of different versions to be tested, and adds complexity and [instabilities to the entire stack](http://blog.goodstuff.im/docker_not_prime_time).

For all of these reasons, we decided to unify both containerizers and enable the Mesos containerizer to launch Docker and AppC containers.

In order to understand how the containerizer can run Docker images without relying on the Docker daemon, we first need to understand that Docker actually consists of two parts: (1) the [container image format]( https://github.com/docker/docker/blob/master/image/spec/v1.md), which allows for the specification of a container image (i.e. how should the container look); and (2) the Docker daemon (or Docker engine), which is the runtime for launching containers (i.e. how to run the container previously specified).


## Implementation
Supporting Docker/AppC images wasn’t as difficult as one might expect, especially since the Mesos containerizer uses many of the same OS features in order to isolate containers, and has been running in large production deployments for many years.

Another factor making it easier is the decision to focus on support for the [Docker image spec](https://github.com/docker/docker/blob/master/image/spec/v1.md), but not necessarily  target all Docker runtime features such as storage or networking. We believe some of those runtime features should be part of a higher level API, since most people only actually use a subset of these runtime features.

Consider, for example, the networking stack: here we decided to use the Container Networking Interface (CNI) instead of Docker’s native Container Network Model (CNM). CNM has been designed specifically with the Docker container orchestration life-cycle in mind, which doesn't play very well with other orchestration engines such as Mesos or Kubernetes. CNI plugins, on the other hand, are completely unaware of the lifecycle of the orchestration engine, making them much more platform independent.

Overall, the simplicity of the CNI allows a lot more independence between container orchestration platforms and vendors developing the device driver, allowing for a much richer and better ecosystem to thrive. We validated that this choice is sufficient by looking at the Docker hub Top 10 and seeing that see that we can we run 90% of the images there.

Proving feature parity with the Docker runtime is not even a goal, as we want to focus on providing a stable and uniform experience covering most container runtime needs.
This experience included not only Docker container images but also AppC container images and (in the future) [OCI images](https://issues.apache.org/jira/browse/MESOS-5011) as well.


## Using it
After all this theory, let’s actually start some containers on a DC/OS 1.8 cluster (instructions for starting one up can be found on [dcos.io](https://dcos.io/docs/1.8/administration/installing/)).

We want to start a simple Redis Docker image using the universal container runtime.
We simply need to deploy the following Marathon app definition by using either the UI, CLI, or HTTP endpoint (check the [DC/OS documentation](https://dcos.io/docs/1.8/usage/) for details on the different ways to deploy a Marathon app).

```json
{
  "id": "/redis",
  "cpus": 1,
  "mem": 128,
  "disk": 0,
  "instances": 1,
  "container": {
    "type": "MESOS",
    "docker": {
      "image": "redis",
      "forcePullImage": false
    }
  },
  "portDefinitions": [
    {
      "port": 6379,
      "protocol": "tcp",
      "name": "redis"
    }
  ]}
```

This might leave some wondering when to use which of the two runtimes/containerizers. Although in DC/OS 1.8 the universal container runtime is still labeled as experimental (which means that it is not considered stable, and we would much appreciate [bug reports](https://jira.dcos.io/secure/Dashboard.jspa)), it is worth evaluating the differences between it and the Docker containerizer. In order to determine which containerizer/runtime will be appropriate for your use case, consider the following points:
* Using the Mesos containerizer with universal container runtime will give you the most uniform user experience.
* New features such as GPUS and pods will first be implemented for Mesos containerizer.
* Unless you rely on some specific Docker runtime feature that is not covered by the universal container runtime, we would recommend using the universal container runtime.

## Further information
* Great MesosCon North America presentation about Mesos containerizer:
https://www.youtube.com/watch?v=rHUngcGgzVM
* DC/OS documentation about using different container runtimes:
https://dcos.io/docs/1.8/usage/containerizers/
* Mesos documentation about running different container images:
http://mesos.apache.org/documentation/latest/container-image/

NOTE: You might have encountered the universal container runtime under the names unified containerizer, universal containerizer, or Mesos containerizer. We finally decided to name it universal container runtime (which enables the Mesos containerizer to run Docker images natively).
