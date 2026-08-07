FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY GestionConvocatorias.Identity.Api/*.csproj GestionConvocatorias.Identity.Api/
RUN dotnet restore GestionConvocatorias.Identity.Api/GestionConvocatorias.Identity.Api.csproj

COPY GestionConvocatorias.Identity.Api/ GestionConvocatorias.Identity.Api/
WORKDIR /src/GestionConvocatorias.Identity.Api
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 5000

ENTRYPOINT ["sh", "-c", "dotnet GestionConvocatorias.Identity.Api.dll --urls http://+:${PORT:-5000}"]
