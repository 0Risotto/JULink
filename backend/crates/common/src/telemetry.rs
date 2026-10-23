use crate::config::LogFormat;

pub fn init(service_name: &str, format: LogFormat) {
    let filter = tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| {
        tracing_subscriber::EnvFilter::new(format!("info,{service_name}=debug,tower_http=info"))
    });

    let builder = tracing_subscriber::fmt()
        .with_env_filter(filter)
        .with_target(true);

    match format {
        LogFormat::Json => builder
            .json()
            .with_current_span(true)
            .with_span_list(true)
            .init(),
        LogFormat::Pretty => builder.init(),
    }
}
