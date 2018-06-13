# ToorCon Schedule Displays

https://hud.toorcon.net/

Test with:
```
python -m SimpleHTTPServer
```


## Flags


Track Selection

https://hud.toorcon.net/?s=track1



Page Rotation

https://hud.toorcon.net/?r=1



Video Stream

https://hud.toorcon.net/?v=1



Testing

https://hud.toorcon.net/?t=1


## pre-commit hooks

Add the following to `.git/hooks/pre-commit` to automatically update the manifest when pushing.

```
#!/bin/sh

epoc=$(date +'%s')

echo "Updating manifest.appcache version: $epoc"
sed -i "s/# v.*$/# v$epoc/g" manifest.appcache 
git add manifest.appcache
```

### Transcoder
Branch: [transcoder](https://github.com/toorcon/schedule/tree/transcoder)
