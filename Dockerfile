FROM archlinux

RUN pacman -Sy --noconfirm bubblewrap npm clang rust make pm2 && pm2 install pm2-logrotate

ENV UI_TITLE="Code Share"
ENV UI_ROOT=/ui
ENV DB_ROOT=/db
ENV PARALLEL_RUNS=32

COPY ui /build/ui
RUN cd /build/ui && \
    npm i && \
    npm run build && \
    mv /build/ui/dist $UI_ROOT && \
    rm -Rf /build

COPY server /server
RUN cd /server && \
    npm i --omit=dev

ENTRYPOINT pm2-runtime start /server/src/server.js