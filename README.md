# ToorCon Schedule Displays

https://toorcon.github.io/schedule/

Test with:
```
python -m SimpleHTTPServer
```


## Flags


Track Selection

https://toorcon.github.io/schedule/?s=track1



Page Rotation

https://toorcon.github.io/schedule/?r=1



Video Stream

https://toorcon.github.io/schedule/?v=1



Testing

https://toorcon.github.io/schedule/?t=1


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
